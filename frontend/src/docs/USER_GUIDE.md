# Project Engagement Tracker - User Guide

## Overview

The PS Engagement Tracker is a web-based application that provides a centralized platform for managing and monitoring the health of professional services projects. It enables teams to track project status using RAG (Red/Amber/Green) indicators and manage mitigation strategies for at-risk projects.

## Getting Started

### Accessing the Application

1. Open your web browser
2. Navigate to the application URL (provided by your administrator)
3. You will be authenticated via Azure AD Single Sign-On
4. Upon successful authentication, you'll see the Overview page

## Navigation

The application uses a sidebar navigation with two main sections:

- **Overview** - Dashboard view with project health summary
- **Projects** - Detailed project information and health history

## Overview Page

### Dashboard Components

#### Overall Health Cards

Two cards at the top display the current distribution of project health statuses, one by project count and one by revenue:

- **Overall Projects Health**: A summary of all projects by their RAG status.
- **RAG by revenue**: A summary of project revenue by RAG status.

#### Summary Cards

A row of cards provides at-a-glance summaries for:

- **Project Managers | Delivery Lead**: Number of projects per manager.
- **Clients**: Number of projects per client.
- **Delivery Cycle**: Number of projects in each stage (Initiation, Execution, etc.).
- **Closing Projects**: Number of projects ending in the next 30 or 45 days.

#### Project List Table

The main table displays all projects with the following columns:

| Column           | Description                                   |
| ---------------- | --------------------------------------------- |
| **Project**      | Project name and code                         |
| **Client**       | Client organization name                      |
| **Status**       | Current RAG health status (color-coded badge) |
| **Risk Area**    | Primary area of concern (if any)              |
| **Last Updated** | Date of the most recent health update         |
| **Actions**      | Button to update project health status        |

### Filtering and Searching

#### Search

Use the search box to filter projects by name or project code.

#### Include Internal Projects

By default, internal projects (marked as "colibri" client) are hidden. Toggle the checkbox to include them in the view.

### Updating Project Health Status

1. Click the **Update** button for any project
2. A modal dialog will open with the following fields:
   - **Health Status** (required): Select Red, Amber, or Green
   - **Risk Area**: Brief description of the main risk (Mandatory when the status is Red or Amber)
   - **RAG by Revenue**: The RAG status specifically for the project's revenue.
   - **Delivery Cycle**: The current stage of the project (e.g., Initiation, Execution).
   - **Mitigation Plan**: Detailed plan to address the risk (Mandatory when the status is Red or Amber)
   - **Comments/Notes**: Any additional information (optional)
3. Click **Save Update** to record the change

## Project Detail Page

Click on any project in the table to view detailed information.

### Project Status Section

Displays the most recent health update with:

- **Project Health Status**: The current RAG status and its recent trend.
- **RAG by Revenue**: The current revenue RAG status and its trend.
- **Delivery Cycle**: The current stage of the project.
- **Risk Area**: The selected area of risk, if any.
- Last update date and user
- Risk area (if applicable)

### Project Information Section

Read-only project metadata sourced from Float:

- Client name
- Project stage
- Project state (Tentative, Confirmed, Closed, Archived)
- Project manager
- Start and end dates

### Financial Details Section

- Total project budget
- Budget type (Fixed, Time & Materials, etc.)
- Project duration

### Team Members Section

Lists all team members scheduled on the project in Float, displayed as:

- Individual names separated by bullets, or
- Concatenated string format for large teams

### Health Status History

A chronological list of all health updates for the project, showing:

- Health status (RAG badge)
- Update date and user
- Risk area
- Mitigation plan
- Comments

Scroll through the history to see trends and previous concerns.

### Updating from Project Detail

Click the **Update Health Status** button at the top of the page to record a new health update without returning to the overview.

## Health Status Definitions

### Red Status

- Project is at high risk
- Significant issues or blockers exist
- Immediate action may be required
- Mitigation plan should be actively executed

### Amber Status

- Project has moderate risk
- Issues exist but are being managed
- Close monitoring required
- May escalate to Red if not addressed

### Green Status

- Project is on track
- No significant risks identified
- Continuing with normal monitoring
- Business as usual

## Data Sourcing

### Read-Only Project Data

The following information is automatically sourced from Float via Databricks and cannot be edited in this application:

- Project name, code, and description
- Client information
- Team member assignments
- Budget and timeline data
- Project state and stage

Float remains the system of record for all project setup, scheduling, and financial data.

### Application-Managed Data

The following information is managed exclusively within this application:

- Health status (RAG)
- Risk areas
- Mitigation plans
- Comments and notes

This data is stored in a secure PostgreSQL database and maintains a complete historical audit trail.

## Best Practices

### Weekly Health Updates

It is recommended to perform health updates on a weekly basis:

- Set a regular day/time for updates (e.g., every Friday)
- Gather input from project team members
- Update the health status and any relevant risks
- Include clear mitigation plans for amber or red projects

### RAG Status Updates

- Be consistent in RAG scoring methodology
- Provide context in risk area and comments
- Update early if concerns emerge
- Clear comments when status improves

### Mitigation Plans

- Be specific about actions and timelines
- Assign responsibility (if applicable)
- Update plans as situations change
- Document when issues are resolved

## Troubleshooting

### I can't see certain projects

- Check if you need to enable "Include internal projects"
- Verify the search term is correct
- Try clearing the search to see all projects

### My health update didn't save

- Ensure Health Status is selected (required field)
- Check your internet connection
- Try again or contact support if the issue persists

### I see old data

- Project information refreshes periodically from Float
- Health updates appear immediately after saving
- The "Last Updated" date shows when the status was last changed

## Support

For technical issues or questions:

1. Contact your IT support team
2. Check the application's help documentation
3. Refer to the Developer Guide for technical details

## FAQ

**Q: Can I edit project information directly in this application?**
A: No, project information is read-only and sourced from Float. All project metadata changes must be made in Float.

**Q: How long is the health status history retained?**
A: All historical updates are permanently retained for audit purposes.

**Q: Can I see projects I don't have permission for?**
A: No, you can only view projects based on your Azure AD group memberships managed by Databricks.

**Q: How often is the project data updated from Float?**
A: Project data is refreshed periodically (frequency determined by your administrator).

**Q: Can I delete or modify a historical health update?**
A: No, all updates are immutable for audit compliance. New updates create new records in the system.
