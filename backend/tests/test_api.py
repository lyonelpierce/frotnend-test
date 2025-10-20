import os

import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.main import create_app


pytestmark = pytest.mark.anyio


@pytest.fixture(scope="module")
async def client():
    os.environ.setdefault("API_TOKEN", "demo")
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        yield http


def auth_headers(token: str = "demo") -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def test_health_endpoints(client: AsyncClient):
    health = await client.get("/-/healthz")
    assert health.status_code == 200
    ready = await client.get("/-/readyz")
    assert ready.status_code == 200
    assert ready.json()["deals"] > 0


async def test_auth_required(client: AsyncClient):
    resp = await client.get("/me")
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "unauthorized"


async def test_me_and_reference(client: AsyncClient):
    me = await client.get("/me", headers=auth_headers())
    assert me.status_code == 200
    assert "email" in me.json()
    reference = await client.get("/reference", headers=auth_headers())
    assert reference.status_code == 200
    body = reference.json()
    assert "stages" in body and "products" in body


async def test_deals_listing_and_pagination(client: AsyncClient):
    resp = await client.get("/deals", headers=auth_headers(), params={"limit": 5})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 5
    cursor = data.get("nextCursor")
    assert cursor
    resp2 = await client.get(
        "/deals",
        headers=auth_headers(),
        params={"limit": 5, "cursor": cursor},
    )
    assert resp2.status_code == 200
    assert resp2.json()["items"]


async def test_update_deal_stage(client: AsyncClient):
    deals = await client.get("/deals", headers=auth_headers(), params={"limit": 1})
    deal = deals.json()["items"][0]
    deal_id = deal["id"]
    new_stage = "Underwriting" if deal["stage"] != "Underwriting" else "Docs"
    resp = await client.patch(
        f"/deals/{deal_id}",
        headers=auth_headers(),
        json={"stage": new_stage},
    )
    assert resp.status_code == 200
    assert resp.json()["stage"] == new_stage


async def test_documents_flow(client: AsyncClient):
    deals = await client.get("/deals", headers=auth_headers(), params={"limit": 1})
    deal_id = deals.json()["items"][0]["id"]
    docs = await client.get(f"/deals/{deal_id}/documents", headers=auth_headers())
    assert docs.status_code == 200
    doc_items = docs.json()["items"]
    assert doc_items
    first_doc = doc_items[0]
    request_resp = await client.post(
        f"/deals/{deal_id}/request-doc",
        headers=auth_headers(),
        json={"checklistItemId": first_doc["id"]},
    )
    assert request_resp.status_code == 202
    assert request_resp.json()["documentId"] == first_doc["id"]
    create_resp = await client.post(
        f"/deals/{deal_id}/documents",
        headers=auth_headers(),
        json={"label": "Insurance Certificate", "type": "other"},
    )
    assert create_resp.status_code == 201
    new_doc_id = create_resp.json()["id"]
    patch_resp = await client.patch(
        f"/documents/{new_doc_id}",
        headers=auth_headers(),
        json={"status": "requested"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "requested"


async def test_tasks_flow(client: AsyncClient):
    deals = await client.get("/deals", headers=auth_headers(), params={"limit": 1})
    deal_id = deals.json()["items"][0]["id"]
    create_task = await client.post(
        f"/deals/{deal_id}/tasks",
        headers=auth_headers(),
        json={"title": "Prepare site visit"},
    )
    assert create_task.status_code == 201
    task = create_task.json()
    update_task = await client.patch(
        f"/tasks/{task['id']}",
        headers=auth_headers(),
        json={"status": "done"},
    )
    assert update_task.status_code == 200
    assert update_task.json()["status"] == "done"


async def test_term_sheet_endpoints(client: AsyncClient):
    deals = await client.get("/deals", headers=auth_headers(), params={"limit": 1})
    deal = deals.json()["items"][0]
    deal_id = deal["id"]
    term_resp = await client.get(f"/deals/{deal_id}/term-sheet", headers=auth_headers())
    assert term_resp.status_code == 200
    term = term_resp.json()
    suggestions_resp = await client.get(
        f"/deals/{deal_id}/term-sheet/suggestions",
        headers=auth_headers(),
        params={"amount": deal["requestedAmount"], "rate": 9.25},
    )
    assert suggestions_resp.status_code == 200
    assert suggestions_resp.json()["suggestions"]


async def test_activity_feed(client: AsyncClient):
    deals = await client.get("/deals", headers=auth_headers(), params={"limit": 1})
    deal_id = deals.json()["items"][0]["id"]
    activity = await client.get(
        f"/deals/{deal_id}/activity",
        headers=auth_headers(),
    )
    assert activity.status_code == 200
    assert isinstance(activity.json(), list)


async def test_jobs_endpoint(client: AsyncClient):
    deals = await client.get("/deals", headers=auth_headers(), params={"limit": 1})
    deal_id = deals.json()["items"][0]["id"]
    job_resp = await client.post(
        f"/deals/{deal_id}/term-sheet/optimize",
        headers=auth_headers(),
    )
    assert job_resp.status_code == 202
    job_id = job_resp.json()["jobId"]
    job_status = await client.get(f"/jobs/{job_id}", headers=auth_headers())
    assert job_status.status_code == 200
    assert job_status.json()["status"] in {"queued", "running", "succeeded", "failed"}
