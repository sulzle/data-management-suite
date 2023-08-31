terraform {
  required_version = ">= 1.1.7, < 2.0.0"
  required_providers {
    azurerm = {
      version = "~>3.70.0"
      source  = "hashicorp/azurerm"
    }

    azuread = {
      version = "~>2.41.0"
      source  = "hashicorp/azuread"
    }
  }
}

data "azurerm_client_config" "current" {}

resource "azurerm_user_assigned_identity" "webapp" {
  name                = "id-${var.stack_name}-webapp"
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = var.default_tags
}

resource "azurerm_container_app" "web" {
  name                         = "ca-${var.short_app_name}-${var.environment_name}-web"
  container_app_environment_id = var.container_app_environment_id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"
  tags = {
    "azd-service-name" : "web"
  }
  identity {
    type         = "SystemAssigned, UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.webapp.id]
  }
  registry {
    server   = var.container_registry_server
    identity = azurerm_user_assigned_identity.webapp.id
  }
  ingress {
    external_enabled = true
    target_port      = 80
    transport        = "auto"
    traffic_weight {
      percentage = 100
    }
  }
  template {
    container {
      name   = "web"
      image  = "${var.container_registry_server}/${var.image_name}"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        value = var.application_insights_connection_string
      }
      env {
        name  = "DATABASE_URL"
        value = var.database_connection_string
      }
      env {
        name  = "SESSION_SECRET"
        value = var.session_secret
      }
      env {
        name  = "PORT"
        value = 80
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "AZURE_CLIENT_ID"
        value = var.app_client_id
      }
      env {
        name  = "AZURE_TENANT_ID"
        value = data.azurerm_client_config.current.tenant_id
      }
      env {
        name  = "AZURE_CLIENT_SECRET"
        value = var.app_client_secret
      }
    }
  }
}