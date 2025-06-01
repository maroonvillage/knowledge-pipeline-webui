terraform {
  cloud {
    # The name of your Terraform Cloud organization.
    organization = "maroonvillage-hcp-organization"
    # The name of the Terraform Cloud workspace to store Terraform state files in.
    workspaces {
        name = "pdfdocintel-cloud-monolith-terraform"
    }
 }
}

#Main - Calls submodule(s), to be implemented.
module "next9_iam" {
  source = "./iam"
  
}
module "next9_s3" {
  source = "./s3"
  region = var.region
  ec2_role_name = module.next9_iam.ec2_role_name
  data_caller_identity_account_id = module.next9_iam.data_caller_identity_account_id
}

module "next9_ecr" {
  source = "./ecr"
  region = var.region
}
module "next9_ec2" {
  source = "./ec2"
  ec2_instance_profile_var = module.next9_iam.instance_profile_name
  region = var.region
}