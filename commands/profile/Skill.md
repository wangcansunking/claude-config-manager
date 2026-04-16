---
name: profile
description: Manage Claude Code configuration profiles — list, create, activate, export, import
---

Manage Claude Code configuration profiles. Use the MCP tools to perform the requested action.

## Available Actions

Based on what the user asks, use the appropriate MCP tool:

- **List profiles**: Call `ccm_list_profiles` tool
- **Create a profile**: Call `ccm_create_profile` with the name the user provides
- **Activate a profile**: Call `ccm_activate_profile` with the profile name
- **Export a profile**: Call `ccm_export_profile` with the profile name. Save the output to a file if the user wants.
- **Import a profile**: Read the file the user provides, then call `ccm_import_profile` with the data and strategy (merge or replace)
- **Delete a profile**: Call `ccm_delete_profile` with the profile name. Confirm with the user first.
- **Update a profile**: Call `ccm_update_profile` with the name and changes

## If the user doesn't specify an action

Call `ccm_list_profiles` and show them what profiles exist, then ask what they'd like to do.
