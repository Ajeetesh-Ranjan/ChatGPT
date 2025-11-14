# Chapter 2: Puppet's Core Architecture: Under the Hood

Understanding Puppet's architecture is essential for effective use and troubleshooting. In this chapter, we'll explore the components that make up a Puppet environment, how they communicate, and how the agent run cycle works.

---

## 2.1 The Key Players: Components of a Puppet Environment

A typical Puppet environment consists of several key components, each with a specific role. Let's examine each one in detail.

### 2.1.1 The Puppet Server (Primary)

The Puppet Server, also called the Puppet Primary or Puppet Master (legacy term), is the central authority in a Puppet infrastructure.

#### Responsibilities

**1. Code Compilation**
- Receives requests from Puppet agents
- Compiles Puppet code into catalogs
- Evaluates Hiera data and merges it with code
- Resolves variables and functions

**2. Certificate Authority (CA)**
- Issues SSL certificates to agents
- Manages the certificate infrastructure
- Validates agent identities

**3. File Server**
- Serves files to agents (via `puppet:///` URLs)
- Provides module content
- Distributes large files efficiently

**4. API Endpoint**
- Provides REST API for agents and tools
- Handles catalog requests
- Processes reports from agents

#### Architecture

The Puppet Server is written in Clojure and runs on the Java Virtual Machine (JVM). This provides:

- **Performance**: JVM optimization and just-in-time compilation
- **Scalability**: Can handle thousands of agents
- **Concurrency**: Efficient handling of multiple simultaneous requests

#### Resource Requirements

**Minimum**:
- 2 CPU cores
- 4 GB RAM
- 10 GB disk space

**Recommended for Production**:
- 4+ CPU cores
- 8+ GB RAM (more for large environments)
- 50+ GB disk space
- SSD storage for better performance

#### High Availability

For production environments, Puppet Servers can be configured in a high-availability setup:

**Load-Balanced Compile Masters**:
```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
         │ Compile │    │ Compile │   │ Compile │
         │ Master 1│    │ Master 2│   │ Master 3│
         └────┬────┘    └────┬────┘   └────┬────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                      ┌──────▼──────┐
                      │  PuppetDB   │
                      │  (Clustered)│
                      └─────────────┘
```

**Benefits**:
- No single point of failure
- Horizontal scaling for large environments
- Maintenance without downtime

#### Configuration

The Puppet Server is configured via `/etc/puppetlabs/puppetserver/conf.d/`:

**puppetserver.conf**: Main server configuration
```hocon
jruby-puppet: {
    max-active-instances: 4
    max-requests-per-instance: 10000
}
```

**webserver.conf**: Web server settings
```hocon
webserver: {
    ssl-host: 0.0.0.0
    ssl-port: 8140
}
```

**auth.conf**: Authorization rules
```hocon
authorization: {
    version: 1
    rules: [
        {
            match-request: {
                path: "/puppet/v3/catalog"
                type: path
            }
            allow: "*"
            sort-order: 500
            name: "puppetlabs catalog"
        }
    ]
}
```

---

### 2.1.2 The Puppet Agent

The Puppet Agent runs on every managed node (server, workstation, network device, etc.). It's the component that actually applies configurations.

#### Responsibilities

**1. Fact Collection**
- Gathers system information via Facter
- Collects custom facts
- Sends facts to the server

**2. Catalog Request**
- Requests a catalog from the server
- Provides node information and facts
- Handles certificate authentication

**3. Catalog Application**
- Applies the catalog to the system
- Makes necessary changes to reach desired state
- Handles errors and failures gracefully

**4. Reporting**
- Generates reports on what changed
- Sends reports to the server
- Logs actions locally

#### Agent Run Modes

**1. Daemon Mode (Default)**
```bash
puppet agent --daemonize
```
- Runs continuously in the background
- Checks in with the server every 30 minutes (configurable)
- Automatically applies changes

**2. One-Shot Mode**
```bash
puppet agent --test
```
- Runs once and exits
- Useful for testing and manual runs
- Provides verbose output

**3. No-Op Mode**
```bash
puppet agent --test --noop
```
- Shows what would change without making changes
- Safe way to test configurations
- Useful for validation

**4. Disabled Mode**
```bash
puppet agent --disable "Maintenance window"
```
- Prevents the agent from running
- Useful during maintenance
- Can be re-enabled with `--enable`

#### Configuration

The agent is configured via `/etc/puppetlabs/puppet/puppet.conf`:

```ini
[main]
certname = webserver01.example.com
server = puppet.example.com
environment = production
runinterval = 30m

[agent]
report = true
graph = true
pluginsync = true
```

**Key Settings**:

- `certname`: The node's certificate name (usually its FQDN)
- `server`: The Puppet Server hostname
- `environment`: Which environment to use
- `runinterval`: How often to run (default: 30 minutes)
- `report`: Whether to send reports to the server
- `pluginsync`: Whether to sync custom facts and types

#### Resource Requirements

The Puppet Agent is lightweight:

**Typical**:
- Minimal CPU usage (only during runs)
- 50-200 MB RAM
- 100 MB disk space

**During Runs**:
- CPU usage spikes briefly
- Memory usage increases temporarily
- Network traffic for catalog and file downloads

#### Platform Support

Puppet Agent runs on:
- **Linux**: RHEL, CentOS, Ubuntu, Debian, SLES, etc.
- **Unix**: Solaris, AIX, HP-UX
- **Windows**: Windows Server 2012+, Windows 10+
- **macOS**: macOS 10.13+
- **Network Devices**: Cisco, Juniper, Arista (via specialized agents)

---

### 2.1.3 Facter: The Fact Gatherer

Facter is a system profiling tool that collects information about nodes. This information, called "facts," is used in Puppet code to make decisions.

#### What are Facts?

Facts are key-value pairs that describe a system:

```yaml
os:
  family: RedHat
  name: CentOS
  release:
    major: 8
    minor: 3
    full: 8.3.2011
architecture: x86_64
processors:
  count: 4
  models:
    - Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz
memory:
  system:
    total: 16.00 GiB
    available: 12.34 GiB
networking:
  hostname: webserver01
  fqdn: webserver01.example.com
  ip: 192.168.1.100
```

#### Types of Facts

**1. Core Facts**

Built-in facts provided by Facter:
- Operating system information
- Hardware details
- Network configuration
- Virtualization platform
- Kernel version

**2. Custom Facts**

Facts you define yourself:

**External Facts** (simple):
```bash
# /etc/puppetlabs/facter/facts.d/datacenter.txt
datacenter=us-east-1
rack=rack-42
```

**Ruby Facts** (complex):
```ruby
# /etc/puppetlabs/facter/facts.d/app_version.rb
Facter.add(:app_version) do
  setcode do
    if File.exist?('/opt/myapp/VERSION')
      File.read('/opt/myapp/VERSION').strip
    else
      'unknown'
    end
  end
end
```

**3. Trusted Facts**

Facts that come from the node's certificate and cannot be overridden:
- `trusted.certname`: The certificate name
- `trusted.domain`: The certificate domain
- `trusted.extensions`: Custom certificate extensions

#### Using Facts in Puppet Code

Facts are available as the `$facts` hash:

```puppet
if $facts['os']['family'] == 'RedHat' {
  package { 'httpd':
    ensure => installed,
  }
} elsif $facts['os']['family'] == 'Debian' {
  package { 'apache2':
    ensure => installed,
  }
}
```

Or using the legacy top-scope variable syntax:

```puppet
if $::osfamily == 'RedHat' {
  # ...
}
```

**Best Practice**: Use the `$facts` hash for clarity and to avoid variable scope issues.

#### Viewing Facts

**On a Node**:
```bash
facter
facter os
facter --json
```

**From Puppet Server**:
```bash
puppet query 'facts[os, memory, processors] { certname = "webserver01.example.com" }'
```

#### Facter Architecture

Facter is written in C++ (Facter 3+) for performance:

**Benefits**:
- Fast fact collection (< 1 second typically)
- Low memory footprint
- Cross-platform consistency

**Fact Resolution Process**:
1. Facter runs on the agent
2. Collects core facts from the system
3. Executes external facts scripts
4. Evaluates Ruby facts
5. Returns structured data to Puppet

---

### 2.1.4 PuppetDB: The Brain of Your Infrastructure Data

PuppetDB is a centralized database that stores all data about your Puppet infrastructure. It's optional but highly recommended for production environments.

#### What PuppetDB Stores

**1. Facts**
- Current facts from all nodes
- Historical fact data
- Fact change history

**2. Catalogs**
- Compiled catalogs for each node
- Resource relationships
- Catalog history

**3. Reports**
- Agent run reports
- What changed on each run
- Success/failure status
- Timing information

**4. Inventory Data**
- List of all managed nodes
- Node status (active, inactive, failed)
- Last check-in times

#### Why PuppetDB is Important

**1. Powerful Queries**

Query your infrastructure with PQL (Puppet Query Language):

```puppet
# Find all nodes running CentOS 8
puppet query 'nodes[certname] { facts.os.name = "CentOS" and facts.os.release.major = "8" }'

# Find all nodes with Apache installed
puppet query 'resources[certname] { type = "Package" and title = "httpd" }'

# Find nodes that failed their last run
puppet query 'nodes[certname] { latest_report_status = "failed" }'
```

**2. Exported Resources**

Share data between nodes:

```puppet
# On database server: export a firewall rule
@@firewall { "100 allow mysql from ${::fqdn}":
  dport  => 3306,
  source => $::ipaddress,
  action => accept,
  tag    => 'mysql_access',
}

# On application servers: collect the rule
Firewall <<| tag == 'mysql_access' |>>
```

**3. Reporting and Analytics**

- Track configuration changes over time
- Identify failing nodes
- Monitor compliance
- Generate reports for auditing

**4. Integration with Tools**

PuppetDB provides a REST API used by:
- Puppet Enterprise Console
- Third-party dashboards (Puppetboard, PuppetExplorer)
- Monitoring systems
- Custom scripts and tools

#### Architecture

PuppetDB consists of:

**1. PostgreSQL Database**
- Stores all data
- Can be clustered for high availability
- Requires regular maintenance (vacuuming, backups)

**2. PuppetDB Service**
- Written in Clojure (runs on JVM)
- Provides REST API
- Handles data ingestion from Puppet Server
- Processes queries

**3. Command Queue**
- Buffers incoming data
- Ensures data isn't lost during high load
- Processes data asynchronously

#### Resource Requirements

**Minimum**:
- 2 CPU cores
- 4 GB RAM
- 20 GB disk space

**Recommended for Production**:
- 4+ CPU cores
- 8+ GB RAM
- 100+ GB disk space (grows with number of nodes and retention period)
- SSD storage for better query performance

**Scaling Guidelines**:
- Small (< 1,000 nodes): Single PuppetDB instance
- Medium (1,000-5,000 nodes): Dedicated PuppetDB server
- Large (5,000+ nodes): Clustered PuppetDB with read replicas

#### Configuration

**puppetdb.conf** (on Puppet Server):
```ini
[main]
server_urls = https://puppetdb.example.com:8081
```

**database.ini** (on PuppetDB server):
```ini
[database]
classname = org.postgresql.Driver
subprotocol = postgresql
subname = //localhost:5432/puppetdb
username = puppetdb
password = secret
```

#### Maintenance

**1. Database Vacuuming**

PostgreSQL requires regular vacuuming:
```bash
sudo -u postgres vacuumdb --all --analyze
```

**2. Data Retention**

Configure how long to keep data:
```hocon
database: {
    report-ttl: 14d
    node-ttl: 7d
    node-purge-ttl: 14d
}
```

**3. Backups**

Regular PostgreSQL backups are essential:
```bash
pg_dump puppetdb > puppetdb-backup-$(date +%Y%m%d).sql
```

---

### 2.1.5 The Certificate Authority (CA)

Puppet uses SSL certificates for authentication and encryption. The Puppet Server acts as a Certificate Authority (CA), issuing certificates to agents.

#### Why Certificates?

**1. Authentication**
- Agents prove their identity to the server
- Server proves its identity to agents
- Prevents unauthorized nodes from getting catalogs

**2. Encryption**
- All communication is encrypted
- Protects sensitive data in transit
- Meets compliance requirements

**3. Authorization**
- Certificates can include custom extensions
- Extensions can be used for authorization decisions
- Enables fine-grained access control

#### Certificate Lifecycle

**1. Agent Generates CSR (Certificate Signing Request)**

When an agent first runs:
```bash
puppet agent --test
```

It generates a private key and CSR:
```
Info: Creating a new SSL key for webserver01.example.com
Info: Caching certificate for ca
Info: csr_attributes file loading from /etc/puppetlabs/puppet/csr_attributes.yaml
Info: Creating a new SSL certificate request for webserver01.example.com
Info: Certificate Request fingerprint (SHA256): 
  AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:...
```

**2. Server Receives CSR**

The CSR is sent to the Puppet Server and queued for signing.

**3. Administrator Signs Certificate**

**Manual Signing**:
```bash
# List pending requests
puppet cert list

# Sign a specific request
puppet cert sign webserver01.example.com

# Sign all pending requests
puppet cert sign --all
```

**Automatic Signing** (use with caution):
```ruby
# /etc/puppetlabs/puppet/autosign.conf
*.example.com
*.dev.example.com
```

Or with a policy-based script:
```bash
# /etc/puppetlabs/puppet/autosign.rb
#!/usr/bin/env ruby
require 'json'

csr = JSON.parse(STDIN.read)
certname = csr['certname']

# Only autosign nodes in specific subnets
if certname =~ /^web\d+\.example\.com$/
  exit 0
else
  exit 1
end
```

**4. Agent Receives Certificate**

Once signed, the agent downloads its certificate:
```
Info: Caching certificate for webserver01.example.com
Info: Caching certificate_revocation_list for ca
```

**5. Secure Communication Established**

The agent can now communicate securely with the server.

#### Certificate Management

**Viewing Certificates**:
```bash
# On server: list all certificates
puppet cert list --all

# On agent: view local certificate
puppet agent --configprint hostcert
openssl x509 -in $(puppet agent --configprint hostcert) -text -noout
```

**Revoking Certificates**:
```bash
# Revoke a certificate
puppet cert revoke webserver01.example.com

# Clean up the revoked certificate
puppet cert clean webserver01.example.com
```

**Regenerating Certificates**:

On the agent:
```bash
# Stop the agent
systemctl stop puppet

# Remove old certificates
rm -rf /etc/puppetlabs/puppet/ssl

# Request new certificate
puppet agent --test
```

On the server:
```bash
# Clean the old certificate
puppet cert clean webserver01.example.com

# Sign the new request
puppet cert sign webserver01.example.com
```

#### Certificate Extensions

Custom certificate extensions enable advanced authorization:

**csr_attributes.yaml** (on agent):
```yaml
extension_requests:
  pp_role: webserver
  pp_environment: production
  pp_datacenter: us-east-1
```

These extensions are included in the certificate and available as trusted facts:
```puppet
if $trusted['extensions']['pp_role'] == 'webserver' {
  include role::webserver
}
```

#### Certificate Troubleshooting

**Common Issues**:

**1. Clock Skew**
- Certificates have validity periods
- If system clocks are out of sync, certificates may appear invalid
- Solution: Ensure NTP is configured on all systems

**2. Hostname Mismatches**
- Certificate name must match the agent's certname
- Solution: Ensure DNS is configured correctly

**3. CA Certificate Changes**
- If the CA certificate is regenerated, all agents need new certificates
- Solution: Plan CA regeneration carefully, or use an external CA

---

## 2.2 The Agent Run Cycle: A Step-by-Step Journey

Understanding the agent run cycle is crucial for troubleshooting and optimization. Let's walk through what happens when a Puppet agent runs.

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AGENT RUN CYCLE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Fact Collection                                         │
│     └─> Facter gathers system information                  │
│                                                             │
│  2. Catalog Request                                         │
│     └─> Agent sends facts to server                        │
│                                                             │
│  3. Catalog Compilation (on server)                        │
│     ├─> Evaluate Puppet code                               │
│     ├─> Query Hiera for data                               │
│     ├─> Resolve variables and functions                    │
│     └─> Build resource graph                               │
│                                                             │
│  4. Catalog Transfer                                        │
│     └─> Server sends catalog to agent                      │
│                                                             │
│  5. Catalog Application                                     │
│     ├─> Agent applies resources in order                   │
│     ├─> Makes necessary changes                            │
│     └─> Handles errors                                     │
│                                                             │
│  6. Report Generation                                       │
│     └─> Agent creates report of changes                    │
│                                                             │
│  7. Report Submission                                       │
│     └─> Agent sends report to server/PuppetDB              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 1: Fact Collection

**What Happens**:
- Facter runs on the agent
- Collects system information (OS, hardware, network, etc.)
- Executes custom facts
- Structures data as JSON

**Timing**: Typically 1-3 seconds

**Example Output**:
```bash
$ facter --timing
os.family: RedHat (0.002s)
os.name: CentOS (0.001s)
processors.count: 4 (0.015s)
memory.system.total: 16.00 GiB (0.003s)
...
Total time: 1.234s
```

**Troubleshooting**:
- Slow fact collection? Check custom facts
- Use `facter --timing` to identify slow facts
- Consider caching expensive facts

### Step 2: Catalog Request

**What Happens**:
- Agent establishes SSL connection to server
- Sends facts to server
- Requests a catalog for its environment

**Network Traffic**:
- Facts: Typically 10-50 KB
- Compressed with gzip

**Example Request**:
```http
POST /puppet/v3/catalog/webserver01.example.com HTTP/1.1
Host: puppet.example.com:8140
Content-Type: application/json

{
  "certname": "webserver01.example.com",
  "environment": "production",
  "facts": { ... },
  "transaction_uuid": "abc123..."
}
```

**Troubleshooting**:
- Connection refused? Check firewall rules (port 8140)
- SSL errors? Check certificate validity
- Timeout? Server may be overloaded

### Step 3: Catalog Compilation (Server-Side)

**What Happens**:
- Server receives facts
- Loads Puppet code for the node's environment
- Evaluates node classification (which classes to apply)
- Queries Hiera for data
- Compiles code into a catalog
- Resolves all variables and functions
- Builds resource dependency graph

**Timing**: Typically 2-10 seconds (varies with code complexity)

**Example Compilation Process**:

1. **Node Classification**:
```puppet
# site.pp
node 'webserver01.example.com' {
  include role::webserver
}
```

2. **Class Evaluation**:
```puppet
# role/manifests/webserver.pp
class role::webserver {
  include profile::base
  include profile::apache
  include profile::monitoring
}
```

3. **Hiera Lookup**:
```yaml
# hiera.yaml
apache::default_vhost: false
apache::mpm_module: prefork
```

4. **Resource Creation**:
```puppet
# Compiled resources
Package[httpd]
File[/etc/httpd/conf/httpd.conf]
Service[httpd]
```

5. **Dependency Resolution**:
```
Package[httpd] -> File[/etc/httpd/conf/httpd.conf] ~> Service[httpd]
```

**Troubleshooting**:
- Slow compilation? Profile your code
- Compilation failures? Check syntax and logic errors
- Use `puppet parser validate` to check syntax

### Step 4: Catalog Transfer

**What Happens**:
- Server sends compiled catalog to agent
- Catalog is JSON (typically 50-500 KB)
- Compressed with gzip

**Example Catalog** (simplified):
```json
{
  "resources": [
    {
      "type": "Package",
      "title": "httpd",
      "parameters": {
        "ensure": "installed"
      }
    },
    {
      "type": "Service",
      "title": "httpd",
      "parameters": {
        "ensure": "running",
        "enable": true
      }
    }
  ],
  "edges": [
    {
      "source": "Package[httpd]",
      "target": "Service[httpd]"
    }
  ]
}
```

**Troubleshooting**:
- Large catalogs? Optimize your code
- Use `puppet catalog diff` to compare catalogs

### Step 5: Catalog Application

**What Happens**:
- Agent receives catalog
- Validates catalog structure
- Sorts resources by dependencies
- Applies resources in order
- Makes necessary system changes
- Handles errors and failures

**Timing**: Varies widely (seconds to minutes)

**Example Application**:

```
Info: Applying configuration version '1699999999'
Notice: /Stage[main]/Apache/Package[httpd]/ensure: created
Info: /Stage[main]/Apache/Package[httpd]: Scheduling refresh of Service[httpd]
Notice: /Stage[main]/Apache/File[/etc/httpd/conf/httpd.conf]/content: 
--- /etc/httpd/conf/httpd.conf	2023-01-01 00:00:00.000000000 +0000
+++ /tmp/puppet-file20231114-12345-abc123	2023-11-14 12:00:00.000000000 +0000
@@ -1,5 +1,5 @@
-ServerTokens OS
+ServerTokens Prod
Info: /Stage[main]/Apache/File[/etc/httpd/conf/httpd.conf]: Scheduling refresh of Service[httpd]
Notice: /Stage[main]/Apache/Service[httpd]/ensure: ensure changed 'stopped' to 'running'
Info: /Stage[main]/Apache/Service[httpd]: Triggered 'refresh' from 2 events
```

**Resource Application Process**:

1. **Check Current State**:
   - Is the package installed?
   - Does the file exist with correct content?
   - Is the service running?

2. **Compare to Desired State**:
   - Should the package be installed?
   - Should the file have different content?
   - Should the service be running?

3. **Make Changes**:
   - Install package if needed
   - Update file if content differs
   - Start service if stopped

4. **Handle Notifications**:
   - If file changed, notify service to restart
   - If package updated, notify service to restart

**Troubleshooting**:
- Resource failures? Check logs for error messages
- Dependency issues? Visualize resource graph
- Use `--debug` for detailed output

### Step 6: Report Generation

**What Happens**:
- Agent generates a report of the run
- Includes what changed, what failed, timing information
- Structured as YAML or JSON

**Report Contents**:
- **Status**: success, failed, or changed
- **Resources**: List of all resources and their status
- **Events**: What changed
- **Logs**: Messages and errors
- **Metrics**: Timing information

**Example Report** (simplified):
```yaml
host: webserver01.example.com
time: 2023-11-14T12:00:00Z
configuration_version: 1699999999
status: changed
resources:
  total: 45
  changed: 3
  failed: 0
  skipped: 0
events:
  - resource: Package[httpd]
    status: success
    message: created
  - resource: File[/etc/httpd/conf/httpd.conf]
    status: success
    message: content changed
  - resource: Service[httpd]
    status: success
    message: triggered refresh
metrics:
  time:
    total: 12.34
    catalog_application: 10.12
    file: 1.23
    package: 5.67
    service: 3.22
```

### Step 7: Report Submission

**What Happens**:
- Agent sends report to Puppet Server
- Server forwards report to PuppetDB (if configured)
- Report is stored for querying and analysis

**Network Traffic**:
- Report size: Typically 10-100 KB
- Compressed with gzip

**Report Processors**:

Puppet can send reports to multiple destinations:

**puppet.conf**:
```ini
[agent]
reports = puppetdb,log,http

[main]
reporturl = https://dashboard.example.com/reports
```

**Available Report Processors**:
- `puppetdb`: Send to PuppetDB
- `log`: Write to local log file
- `http`: POST to HTTP endpoint
- `store`: Store on Puppet Server
- Custom processors (Ruby plugins)

**Troubleshooting**:
- Reports not appearing? Check report processor configuration
- PuppetDB connection issues? Check network and credentials

### Complete Run Example

Let's see a complete agent run with timing:

```bash
$ puppet agent --test
Info: Using configured environment 'production'
Info: Retrieving pluginfacts
Info: Retrieving plugin
Info: Caching catalog for webserver01.example.com
Info: Applying configuration version '1699999999'

Notice: /Stage[main]/Apache/Package[httpd]/ensure: created
Info: /Stage[main]/Apache/Package[httpd]: Scheduling refresh of Service[httpd]

Notice: /Stage[main]/Apache/File[/etc/httpd/conf/httpd.conf]/content: 
--- /etc/httpd/conf/httpd.conf	2023-01-01 00:00:00.000000000 +0000
+++ /tmp/puppet-file20231114-12345-abc123	2023-11-14 12:00:00.000000000 +0000
@@ -1,5 +1,5 @@
-ServerTokens OS
+ServerTokens Prod

Info: /Stage[main]/Apache/File[/etc/httpd/conf/httpd.conf]: Scheduling refresh of Service[httpd]

Notice: /Stage[main]/Apache/Service[httpd]/ensure: ensure changed 'stopped' to 'running'
Info: /Stage[main]/Apache/Service[httpd]: Triggered 'refresh' from 2 events

Notice: Applied catalog in 12.34 seconds
```

**Timing Breakdown**:
- Fact collection: 1.2s
- Plugin sync: 0.5s
- Catalog request: 0.3s
- Catalog compilation (server): 3.1s
- Catalog transfer: 0.2s
- Catalog application: 12.3s
- Report generation: 0.1s
- Report submission: 0.2s
- **Total**: ~18s

---

## 2.3 Open Source Puppet vs. Puppet Enterprise (PE)

Puppet comes in two editions: Open Source Puppet and Puppet Enterprise. Let's compare them.

### Open Source Puppet

**What's Included**:
- Puppet Server
- Puppet Agent
- Facter
- PuppetDB
- Puppet language and core modules
- Command-line tools

**Licensing**:
- Apache 2.0 license
- Free to use
- No restrictions on number of nodes

**Support**:
- Community support (forums, Slack, IRC)
- Community-contributed modules
- Documentation and tutorials

**Best For**:
- Small to medium deployments
- Organizations with strong Puppet expertise
- Budget-conscious projects
- Learning and experimentation

### Puppet Enterprise (PE)

**What's Included**:

Everything in Open Source, plus:

**1. Web-Based Console**
- Graphical interface for managing Puppet
- Node management and classification
- Report viewing and analysis
- Role-based access control (RBAC)

**2. Code Manager**
- Automated code deployment from Git
- Environment management
- Webhook integration

**3. Orchestrator**
- Run Puppet on-demand across nodes
- Control order of Puppet runs
- Application orchestration

**4. Puppet Bolt Integration**
- Ad-hoc task execution
- Plan-based automation
- Integrated with console

**5. Enhanced Reporting**
- Advanced analytics
- Compliance reporting
- Custom dashboards

**6. High Availability**
- Built-in HA configuration
- Automated failover
- Load balancing

**7. Commercial Support**
- 24/7 support from Puppet
- SLA guarantees
- Professional services
- Training and certification

**Licensing**:
- Commercial license
- Priced per node
- Free tier: Up to 10 nodes

**Best For**:
- Large enterprise deployments
- Organizations requiring commercial support
- Compliance-heavy environments
- Teams needing GUI management

### Feature Comparison

| Feature | Open Source | Enterprise |
|---------|-------------|------------|
| Puppet Server | ✓ | ✓ |
| Puppet Agent | ✓ | ✓ |
| PuppetDB | ✓ | ✓ |
| Command-line tools | ✓ | ✓ |
| Web console | ✗ | ✓ |
| Node classification GUI | ✗ | ✓ |
| Code Manager | ✗ | ✓ |
| Orchestrator | ✗ | ✓ |
| RBAC | ✗ | ✓ |
| Advanced reporting | ✗ | ✓ |
| Commercial support | ✗ | ✓ |
| High availability | Manual | Built-in |
| Price | Free | Per node |

### Making the Choice

**Choose Open Source Puppet if**:
- You have < 100 nodes
- You have strong Puppet expertise in-house
- You're comfortable with command-line tools
- Budget is a primary concern
- You don't need commercial support

**Choose Puppet Enterprise if**:
- You have > 100 nodes
- You need a GUI for less technical users
- You require commercial support and SLAs
- Compliance reporting is critical
- You want built-in high availability
- You need role-based access control

### Migration Path

You can start with Open Source and migrate to Enterprise later:

**Migration Process**:
1. Install Puppet Enterprise
2. Point agents to new PE server
3. Import existing code and data
4. Configure PE-specific features
5. Decommission old Open Source server

**Compatibility**:
- Puppet code is 100% compatible
- Agents work with both versions
- PuppetDB data can be migrated

### Third-Party Alternatives to PE Features

If you use Open Source Puppet, you can add similar functionality with third-party tools:

**Web Console**:
- Foreman
- Puppetboard
- PuppetExplorer

**Code Deployment**:
- r10k
- Puppet Bolt

**Orchestration**:
- MCollective (deprecated)
- Ansible
- Puppet Bolt

**Reporting**:
- Grafana + Prometheus
- ELK Stack (Elasticsearch, Logstash, Kibana)

---

## Summary

In this chapter, we've explored Puppet's architecture in detail:

1. **Puppet Server** is the central authority that compiles catalogs and manages certificates.

2. **Puppet Agent** runs on managed nodes, applying configurations and reporting results.

3. **Facter** collects system information (facts) used in Puppet code.

4. **PuppetDB** stores all infrastructure data and enables powerful queries.

5. **Certificate Authority** provides authentication and encryption via SSL certificates.

6. **The Agent Run Cycle** consists of seven steps: fact collection, catalog request, compilation, transfer, application, report generation, and submission.

7. **Open Source vs. Enterprise**: Open Source is free and powerful; Enterprise adds GUI, orchestration, and commercial support.

Understanding this architecture is essential for effective Puppet use, troubleshooting, and scaling. In the next chapter, we'll start writing Puppet code and building our infrastructure.

---

**Next**: [Chapter 3: The Puppet Language: Describing Your Infrastructure as Code](#chapter-3)
