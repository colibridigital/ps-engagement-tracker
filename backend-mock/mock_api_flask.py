from flask import Flask, jsonify, request
from datetime import datetime, timedelta
from flask_cors import CORS # Import this
import copy
app = Flask(__name__)
CORS(app)
# --- Mock Data ---

# Projects List (Used by /api/projects/)
delivery_cycle = {"initiation":12, "execution": 53,"closure":55,"on_hold":2}
projects_db = [
    {
        "project": {
            "project_id": i,
            "project_code": f"PROJ-{100+i}",
            "project_name": f"Project Name Colibri Nasstar {chr(64+i)}",
            "client_name": f"Client {chr(65+i)}",
            "client_id": f"CL-{i}",
            "stage": "Discovery",
            "project_manager": f"Manager {i%3}",
            "project_manager_email": f"pm{i}@example.com",
            "project_note": "Standard project note",
            "created_timestamp": "2026-04-20T10:00:00Z",
            "project_modified_timestamp": "2026-04-23T09:51:41.680Z",
            "budget_per_phase": True,
            "project_status": 1,
            "project_active": True,
            "is_tentative": False,
            "is_billable": True,
            "project_tags": "cloud,ai",
            "total_budget": "50000",
            "budget_type": "Fixed",
            "budget_currency": "GBP",
            "budget_currency_rate": 1.0,
            "project_planned_start_date": "2026-01-20T10:00:00Z",
            "project_planned_end_date": "2026-05-23T09:51:41.680Z",
        },
        "current_status": {
            "health_status": "green" if i % 2 == 0 else "amber",
            "rag_by_revenue": "green" if i % 3 == 0 else "amber",
            "risk_area": "Technical solution",
            "mitigation_plan": f"On track with milestones for {chr(64+i)} but if any delay occurs, we will reallocate resources.",
            "comments": "Everything is proceeding as expected.Everything is proceeding as expected.Everything is proceeding as expected.",
            "updated_by": "Admin User",
            "updated_at": "2026-04-24T10:43:44.737Z",
            "delivery_cycle":f"{list(delivery_cycle.keys())[i%4]}",
            "version": 1
        }
    }
    for i in range(1, 11)
]

# RAG Distribution (Used by /api/projects/overview/rag-project-health)
rag_data = {"red_count": 2, "amber_count": 4, "green_count": 4, "total_count": 20, "completed_count": 10}
rag_data_revenue = {"red_count": 5, "amber_count": 1, "green_count": 4, "total_count": 20, "completed_count": 10}
# Engagements by PM/Client (Used by /api/projects/overview/engagements-by-*)
engagements_pm = {"Manager 0": 3, "Manager 1": 4, "Manager 2": 3,"Manager 4": 3, "Manager 1": 5, "Manager 2": 6, "Manager 3": 7, "Manager 8": 8}
engagements_client = {"Client A": 3, "Client B": 3, "Client C": 2, "Client D": 2,"Client A1": 13, "Client B1": 13, "Client C1": 12, "Client D1": 12}


closing_projects = {"in_30_days": 2, "in_45_days": 3}



# Change History (Used by /api/projects/<id>/change-history)
# Mapping each project ID to a list of 3 historical entries
change_history_db = {
    i: [
        {
            "id": i,
            "project_code": f"PROJ-{100+i}",
            "project_name": f"Project {chr(64+i)}",
            "client_name": f"Client {chr(64+i)}",
            "health_status": "green" if j > 1 else "red", # Example logic
            "rag_by_revenue": "green" if j > 1 else "red",
            "risk_area": "Resource risk",
            "delivery_cycle":"execution",
            "mitigation_plan": "Increasing headcount",
            "comments": f"Update iteration {j}",
            "updated_by": f"Admin {j}",
            "updated_at": (datetime.utcnow() - timedelta(days=j)).isoformat() + "Z"
        }
        for j in range(1, 4)
    ] 
    for i in range(1, 11)
}

# --- Routes ---/api/projects/overview/delivery-cycle

@app.route('/api/projects/', methods=['GET'])
def get_projects(): 
    include_internal = request.args.get('include_internal', 'false').lower() == 'true'
    if include_internal:

        result = copy.deepcopy(projects_db)
        result.append({
            "project": {
                "project_id": 999,
                "project_code": "INT-001",
                "project_name": "Internal Platform Project",
                "client_name": "Colibri",
                "client_id": "INTERNAL",
                "stage": "Delivery",
                "project_manager": "Internal Manager",
                "project_manager_email": "internal.pm@example.com",
                "project_note": "Internal-only project",
                "created_timestamp": "2026-04-01T10:00:00Z",
                "project_modified_timestamp": "2026-04-24T09:51:41.680Z",
                "budget_per_phase": False,
                "project_status": 1,
                "project_active": True,
                "is_tentative": False,
                "is_billable": False,
                "project_tags": "internal,platform",
                "total_budget": "0",
                "budget_type": "Internal",
                "budget_currency": "GBP",
                "budget_currency_rate": 1.0,
                "project_planned_start_date": "2026-02-01T10:00:00Z",
                "project_planned_end_date": "2026-12-31T18:00:00Z"
            },
            "current_status": {
                "health_status": "green",
                "rag_by_revenue": "green",
                "risk_area": "None",
                "mitigation_plan": "N/A",
                "comments": "Internal delivery on track",
                "updated_by": "System",
                "updated_at": "2026-04-24T10:43:44.737Z",
                "delivery_cycle": "Quarterly",
                "version": 1
            }
        })

        return jsonify(result)


    return jsonify(projects_db)

@app.route('/api/projects/overview/rag-project-health', methods=['GET'])
def get_rag(): return jsonify(rag_data)

@app.route('/api/projects/overview/rag-project-revenue', methods=['GET'])
def get_rag_revenue(): return jsonify(rag_data_revenue)

@app.route('/api/projects/overview/engagements-by-pm', methods=['GET'])
def get_engagements_pm(): return jsonify(engagements_pm)

@app.route('/api/projects/overview/engagements-by-client', methods=['GET'])
def get_engagements_client(): return jsonify(engagements_client)

@app.route('/api/projects/overview/closing-projects', methods=['GET'])
def get_closing(): return jsonify(closing_projects)

@app.route('/api/projects/overview/delivery-cycle', methods=['GET'])
def get_delivery_cycle(): return jsonify(delivery_cycle)

@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    # Find the entry where the nested project_id matches
    entry = next((p for p in projects_db if p['project']['project_id'] == project_id), None)
    
    if entry:
        return jsonify(entry)
    else:
        return jsonify({"message": "Not Found"}), 404

@app.route('/api/projects/<int:project_id>/change-history', methods=['GET'])
def get_history(project_id): return jsonify(change_history_db.get(project_id, []))

@app.route('/api/projects/<int:project_id>/rag-trend', methods=['GET'])
def get_rag_trend(project_id):
    h = sorted(change_history_db.get(project_id, []), key=lambda x: x["updated_at"])[-3:]
    return jsonify({
        "health_status": [{"value": i["health_status"], "updated_at": i["updated_at"]} for i in h],
        "rag_by_revenue": [{"value": i["rag_by_revenue"], "updated_at": i["updated_at"]} for i in h]+ [   {
      "updated_at": "2026-04-26T15:05:57.177933Z",
      "value": "amber"
    }]
    })


@app.route('/api/projects/<int:project_id>/team', methods=['GET'])
def get_team(project_id): return jsonify({ "team":["Abit K Sebin", "Sean Reeve", "Darren"]})

@app.route('/api/projects/search', methods=['GET'])
def search():
    key = request.args.get('key', '').lower()
    return jsonify([p for p in projects_db if key in p['project_name'].lower() or key in p['project_code'].lower()])

@app.route('/api/projects/<int:project_id>/status-update', methods=['POST'])
def update_status(project_id):
    data = request.get_json()
    print(data)
    if not data:
        # 400 Bad Request
        return jsonify({"error": "No data provided"}), 400
    
    # If project not found in database
    if project_id ==2:
        # 404 Not Found
        return jsonify({"error": "Unable to update status"}), 404
        
    return jsonify({"status": "success"}), 201

if __name__ == '__main__':
    app.run(debug=True, port=5000)