terraform {
    backend "gcs" {
        bucket = "nimbus-plataform-terraform-state"
        prefix = "terraform/state/clouds-infra"
    }
}