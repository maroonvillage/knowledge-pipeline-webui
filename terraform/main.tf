terraform {
  cloud {
    # The name of your Terraform Cloud organization.
    organization = "maroonvillage-hcp-organization"
    # The name of the Terraform Cloud workspace to store Terraform state files in.
    workspaces {
        name = "next9-monolith-app-dev_2"
    }
 }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

#Main - Calls submodule(s), to be implemented.
module "next9_iam" {
  source                               = "./iam"
  prefix                               = var.prefix
  aws_account_id                       = data.aws_caller_identity.current.account_id
  aws_region                           = data.aws_region.current.name
  ec2_policy_instance_arn                  = var.ec2_policy_instance_arn
  ecr_policy_instance_arn                  = var.ecr_policy_instance_arn
  s3_policy_instance_arn                   = var.s3_policy_instance_arn
  secretsmgr_policy_instance_arn           = var.secretsmgr_policy_instance_arn
}

module "next9_ecr" {
  source = "./ecr"
  region = data.aws_region.current.name
}
module "next9_ec2" {
  source = "./ec2"
  ec2_instance_profile_var = module.next9_iam.ec2_instance_profile_name
  region = data.aws_region.current.name
  ssh_key_pair_name = var.ssh_key_pair_name
}

module "next9_s3" {
  source = "./s3"
  region =  data.aws_region.current.name
  ec2_role_name = module.next9_iam.ec2_instance_profile_name
  data_caller_identity_account_id = module.next9_iam.data_caller_identity_account_id
  ec2_dns_name = module.next9_ec2.instance_public_dns
}