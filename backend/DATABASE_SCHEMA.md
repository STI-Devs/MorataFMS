# F.M. Morata FMS - Database Schema Diagram

This document illustrates the database relationships for the Freight Management System using Mermaid.js.

```mermaid
erDiagram
    %% USERS TABLE
    users {
        bigint id PK
        string name
        string email
        enum role "encoder, broker, supervisor, manager, admin"
    }

    %% CLIENTS TABLE
    clients {
        bigint id PK
        string name
        enum type "importer, exporter, both"
        bigint country_id FK
    }

    %% COUNTRIES TABLE
    countries {
        bigint id PK
        string name
        string code
    }

    %% IMPORT TRANSACTIONS
    import_transactions {
        bigint id PK
        string customs_ref_no
        string bl_no
        bigint importer_id FK
        bigint assigned_user_id FK
        enum status "pending, in_progress, completed, cancelled"
    }

    %% IMPORT STAGES
    import_stages {
        bigint id PK
        bigint import_transaction_id FK
        enum boc_status
        bigint boc_completed_by FK
        enum ppa_status
        bigint ppa_completed_by FK
        enum do_status
        bigint do_completed_by FK
        enum port_charges_status
        bigint port_charges_completed_by FK
        enum releasing_status
        bigint releasing_completed_by FK
        enum billing_status
        bigint billing_completed_by FK
    }

    %% EXPORT TRANSACTIONS
    export_transactions {
        bigint id PK
        bigint shipper_id FK
        string bl_no
        bigint destination_country_id FK
        bigint assigned_user_id FK
        enum status
    }

    %% EXPORT STAGES
    export_stages {
        bigint id PK
        bigint export_transaction_id FK
        enum docs_prep_status
        bigint docs_prep_completed_by FK
        enum co_status
        bigint co_completed_by FK
        enum cil_status
        bigint cil_completed_by FK
        enum bl_status
        bigint bl_completed_by FK
    }

    %% DOCUMENTS (Polymorphic)
    documents {
        bigint id PK
        string documentable_type
        bigint documentable_id
        string type
        string filename
        string path
        bigint uploaded_by FK
    }

    %% RELATIONSHIPS

    %% User Relationships
    users ||--o{ import_transactions : "assigned to"
    users ||--o{ export_transactions : "assigned to"
    users ||--o{ import_stages : "completes stages"
    users ||--o{ export_stages : "completes stages"
    users ||--o{ documents : "uploads"

    %% Client Relationships
    clients }o--|| countries : "based in"
    clients ||--o{ import_transactions : "is importer"
    clients ||--o{ export_transactions : "is shipper"

    %% Import Relationships
    import_transactions ||--|| import_stages : "has tracking"
    import_transactions ||--o{ documents : "has docs (polymorphic)"

    %% Export Relationships
    export_transactions }o--|| countries : "destination"
    export_transactions ||--|| export_stages : "has tracking"
    export_transactions ||--o{ documents : "has docs (polymorphic)"

```

## Key Relationships Key

| Relationship | Description |
|---|---|
| **Users ↔ Transactions** | A user is assigned to handle specific transactions (Import/Export). |
| **Users ↔ Stages** | Specific users mark individual stages (e.g., BOC, PPA) as completed. |
| **Clients ↔ Transactions** | Clients are linked as 'importer' for Imports or 'shipper' for Exports. |
| **Transactions ↔ Stages** | One-to-One. Each transaction has exactly one matching record in the corresponding stages table. |
| **Transactions ↔ Documents** | One-to-Many (Polymorphic). Both Import and Export transactions can have multiple attached documents. |
