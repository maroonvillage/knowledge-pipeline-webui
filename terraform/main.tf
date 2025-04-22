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
module "next9_s3" {
  source = "./s3"
}
module "next9_ecr" {
  source = "./ecr"
}
module "next9_ec2" {
  source = "./ec2"
}