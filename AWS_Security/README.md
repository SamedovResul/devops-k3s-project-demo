# AWS DevOps Technical Assignment

## Architecture Diagram

```
                                    INTERNET
                                        │
                                        ▼
                              ┌─────────────────┐
                              │ Internet Gateway │
                              └────────┬────────┘
                                       │
┌──────────────────────────────────────┴───────────────────────────────────────┐
│                          VPC: 10.0.0.0/16 (eu-central-1)                     │
│                                                                              │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────┐  │
│  │   Public Subnet A (10.0.1.0/24) │    │   Public Subnet B (10.0.2.0/24) │  │
│  │        eu-central-1a            │    │        eu-central-1b            │  │
│  │                                 │    │                                 │  │
│  │  ┌───────────────────────────┐  │    │  ┌───────────────────────────┐  │  │
│  │  │     NAT Gateway           │  │    │  │                           │  │  │
│  │  │     (Elastic IP)          │  │    │  │                           │  │  │
│  │  └───────────────────────────┘  │    │  │                           │  │  │
│  │                                 │    │  │                           │  │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │  │
│  │  │              Application Load Balancer (ALB)                │   │  │  │
│  │  │                    Port 80 (HTTP)                           │   │  │  │
│  │  │              Security Group: ALB-SG                         │   │  │  │
│  │  │              - Inbound: 80 from 0.0.0.0/0                   │   │  │  │
│  │  │              - Outbound: 80 to App-SG                       │   │  │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │  │
│  │                             │                                 │    │  │  │
│  └─────────────────────────────┼─────────────────────────────────┼────┘  │  │
│                                │                                 └───────┘  │
│                                │                                            │
│                                ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                  Private Subnet (10.0.10.0/24)                       │   │
│  │                       eu-central-1a                                  │   │
│  │                                                                      │   │
│  │   ┌────────────────────────────────────────────────────────────┐     │   │
│  │   │                   EC2 Instance (t3.small)                  │     │   │
│  │   │                      Ubuntu + Nginx                        │     │   │
│  │   │                    "Hello World" App                       │     │   │
│  │   │                                                            │     │   │
│  │   │   Security Group: App-SG                                   │     │   │
│  │   │   - Inbound: 80 from ALB-SG                                │     │   │
│  │   │   - Inbound: 22 from VPC (10.0.0.0/16)                     │     │   │
│  │   │   - Outbound: 443, 80, 53 (updates & DNS)                  │     │   │
│  │   │                                                            │     │   │
│  │   │   IAM Role: app-role                                       │     │   │
│  │   │   - SSM:GetParameter (/app/*)                              │     │   │
│  │   │   - CloudWatch Logs (/app/nginx)                           │     │   │
│  │   └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │   Route: 0.0.0.0/0 → NAT Gateway                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │  AWS Services   │
                              ├─────────────────┤
                              │ SSM Parameter   │
                              │ Store           │
                              │ /app/secret_key │
                              ├─────────────────┤
                              │ CloudWatch Logs │
                              │ /app/nginx      │
                              └─────────────────┘
```

## Traffic Flow

**User Request:**
```
  [Internet]                                              
      │                                                   
      ▼                                                   
  [Internet Gateway]                                      
      │                                                   
      ▼                                                   
  [ALB - Public Subnets] ──── Port 80 ────► [EC2 - Private Subnet]
      │                                            │      
      │                                            ▼      
      │                                     [Nginx Server]
      │                                            │      
      └◄───────── HTTP Response ◄──────────────────┘      
```

**EC2 Outbound (Package Updates):**
```
  [EC2 - Private Subnet]                                  
      │                                                   
      ▼                                                   
  [NAT Gateway - Public Subnet]                           
      │                                                   
      ▼                                                   
  [Internet Gateway]                                      
      │                                                   
      ▼                                                   
  [Internet - apt repositories]                           
```

---

## Deployment Instructions

**Prerequisites:**
- AWS CLI installed and configured
- Terraform version 1.0+
- SSH key at ~/.ssh/id_ed25519.pub
- AWS IAM permissions for VPC, EC2, ALB, IAM, SSM, CloudWatch

**Commands to run:**
```bash
terraform init
terraform plan
terraform apply
terraform output alb_url
```

**How to test:**
- Wait 2-3 minutes for EC2 bootstrap
- `curl <alb_url>` or open in browser
- Expected output: `<h1>Hello World!</h1>`

**How to destroy:**
```bash
terraform destroy
```

---

## Security Decisions Explanation

The application runs in a private subnet without a public IP, ensuring it cannot be directly accessed from the internet. My app is inside a locked building (private subnet). Visitors must go through the front desk (ALB) - they cannot enter through windows or back doors.

I created a NAT Gateway in the public subnet because EC2 needs internet access to download packages (apt-get install nginx). NAT Gateway allows outbound - EC2 can reach internet for updates. NAT blocks inbound - Internet cannot initiate connections to EC2.

**Security Best Practices Applied:**

- **Security Group References** - Used SG-to-SG references instead of CIDR blocks for ALB-to-App communication, ensuring rules remain valid if IPs change.

- **Minimal Egress** - Outbound traffic limited to ports 443, 80, and 53 only, preventing compromised servers from connecting to arbitrary destinations.

- **Scoped IAM Policy** - Resource restricted to arn:aws:ssm:eu-central-1:*:parameter/app/*, preventing access to other parameters even if role is compromised.

- **Internal SSH Only** - SSH access limited to VPC CIDR (10.0.0.0/16), requiring bastion or VPN for administrative access.

- **ALB Egress Restriction** - Load balancer can only communicate with application security group, not internet or other resources.

- **Application Logging** - Nginx access and error logs sent to CloudWatch Log Group (/app/nginx) for centralized monitoring. Logs auto-delete after 7 days to manage costs.

---

## IAM Role Explanation

- **app-role**: Allows EC2 instance to authenticate with AWS services without storing credentials.

- **app-ssm-cloudwatch-policy**: Grants read-only access to SSM parameters under /app/* path, and write access to CloudWatch Logs for application monitoring.

- **app-instance-profile**: Attaches the IAM role to the EC2 instance.

---

## Trade-offs and Assumptions

**Trade-offs:**
- Single EC2 instead of Auto Scaling Group (simpler, but no high availability)
- HTTP only, no HTTPS (no domain needed, but traffic not encrypted)
- One private subnet, not multi-AZ (lower cost, but single point of failure)
- NAT Gateway instead of NAT Instance (reliable, but ~$32/month cost)
- CloudWatch Logging enabled (adds ~$0.50/GB ingested, but provides visibility)

**Assumptions:**
- Region is eu-central-1
- SSH key exists at ~/.ssh/id_ed25519.pub
- Ubuntu AMI ami-0faab6bdbac9486fb is available
- No CI/CD pipeline needed
- CloudWatch logging enabled for Nginx (access and error logs)

---

## Bonus Features Implemented

**CloudWatch Logging:**
- Log Group: /app/nginx
- Log Streams: {instance_id}/access, {instance_id}/error
- Retention: 7 days
- View logs: AWS Console → CloudWatch → Log Groups → /app/nginx

---

## File Structure

```
.
├── main.tf          # All infrastructure resources
└── README.md        # This file
```
## Url Link
  
   http://AwsTask-alb-1714107936.eu-central-1.elb.amazonaws.com