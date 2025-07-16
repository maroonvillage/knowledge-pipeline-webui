#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# Define relative paths to our tool directories from the script's location
TERRAFORM_DIR="terraform"
ANSIBLE_DIR="ansible"
ANSIBLE_INVENTORY_FILE="${ANSIBLE_DIR}/inventory.ini"
TERRAFORM_PLAN_FILE="terraform_plan_output.tfplan"

echo "--- Step 1: Generating Terraform execution plan ---"
# Change into the terraform directory to run the plan
(
  cd "$TERRAFORM_DIR"
  terraform plan -out="$TERRAFORM_PLAN_FILE"
)

# Note: Comment out the below 'Interactive Approval Step' if you want to skip manual approval
# --- Interactive Approval Step ---
echo
read -p "Terraform plan has been generated. Do you want to apply this plan? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Deployment aborted by user."
    # Clean up the plan file if we abort
    rm -f "${TERRAFORM_DIR}/${TERRAFORM_PLAN_FILE}"
    exit 1
fi

echo "--- Step 2: Applying Terraform plan ---"
# Change into the terraform directory to run terraform commands
(
  cd "$TERRAFORM_DIR"
  terraform apply -auto-approve "$TERRAFORM_PLAN_FILE"
)
# The parentheses () run the command in a subshell, so we automatically
# return to the root directory without needing a second 'cd'.

echo "--- Step 3: Extracting Terraform outputs ---"
# We need to run 'terraform output' from within the terraform directory
TF_OUTPUTS=$(cd "$TERRAFORM_DIR" && terraform output -json)
PUBLIC_IP=$(echo $TF_OUTPUTS | jq -r '.instance_public_ip.value')
PUBLIC_DNS=$(echo $TF_OUTPUTS | jq -r '.instance_public_dns.value')

# Validate that we got the outputs
if [ -z "$PUBLIC_IP" ] || [ -z "$PUBLIC_DNS" ]; then
    echo "Error: Could not retrieve Terraform outputs. Exiting."
    exit 1
fi

echo "Public IP: $PUBLIC_IP"
echo "Public DNS: $PUBLIC_DNS"

read -p "Press any key to continue..." -n 1 -r
echo

echo "--- Step 4: Building the React Frontend with the correct API endpoint ---"
# Set the environment variable for the build process
#export REACT_APP_API_ENDPOINT="https://${PUBLIC_DNS}"
echo "AWS_REGION=us-west-1" > .prod.env
echo "REACT_APP_API_ENDPOINT=https://${PUBLIC_DNS}" >> .prod.env
#npm run build
dotenv -f .prod.env -e false run npm run build
# After this, you would typically build your Docker image with these new static files


# echo "--- Step 5: Building the Docker image ---"
docker-compose up --build -d

echo "--- Step 6: Dynamically creating the Ansible inventory file ---"
cat <<EOF > "$ANSIBLE_INVENTORY_FILE"
[web]
$PUBLIC_IP ansible_user=ec2-user ansible_ssh_private_key_file=~/.ssh/pdfdocintel_ssh_key_pair.pem
EOF
echo "$ANSIBLE_INVENTORY_FILE created."


# --- Interactive Approval Step ---
echo
read -p "Would you like to proceed with Ansible deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Deployment aborted by user: skipping Ansible deployment."
    # Clean up the plan file if we abort
    rm -f "${TERRAFORM_DIR}/${TERRAFORM_PLAN_FILE}"
    exit 1
fi


echo "--- Step 7: Running Ansible to deploy the application ---"
# Pass the public_dns_name as an "extra variable" to the playbook
ansible-playbook -i "$ANSIBLE_INVENTORY_FILE" "${ANSIBLE_DIR}/deploy.yml" \
  --extra-vars "public_dns_name=${PUBLIC_DNS}" \
  --extra-vars "public_ip_address=${PUBLIC_IP}" \
  --extra-vars "allowed_cors_origins=http://${PUBLIC_IP}:3000,https://${PUBLIC_IP}:3000,https://${PUBLIC_DNS}:3000,http://${PUBLIC_DNS}:3000"

echo "--- Deployment Complete ---"


# Clean up the Terraform plan file
echo "--- Performing Clean up ---"
rm -f "${TERRAFORM_DIR}/${TERRAFORM_PLAN_FILE}"