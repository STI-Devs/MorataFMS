# Park / Resume the EC2 Instance

## Park (Stop + release EIP)

1. EC2 → Instances → **Stop**
2. EC2 → Elastic IPs → select EIP → **Disassociate** → then **Release**
3. (Optional) EC2 → Volumes → root volume → **Create snapshot**

## Resume (Start + new EIP + re-point DNS)

1. EC2 → Instances → **Start** (services auto-start)
2. EC2 → Elastic IPs → **Allocate** → **Associate** to the instance → note the new IP
3. Cloudflare: A record `app-s2` → **new IP** (DNS only, propagates in minutes)
4. Verify: `curl -I https://app-s2.fmmcbs.com/up` → 204/200

> Cert stays valid (issued for the domain, not the IP). If the site seems "down" after resume, the IP changed — re-point DNS.