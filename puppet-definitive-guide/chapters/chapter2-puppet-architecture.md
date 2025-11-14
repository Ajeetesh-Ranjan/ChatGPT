# Chapter 2: Puppet's Core Architecture: Under the Hood

> "Architecture is about the important stuff. Whatever that is." - Ralph Johnson

Understanding Puppet's architecture is crucial for effective deployment and troubleshooting. This chapter provides a comprehensive look at how Puppet's components work together to manage your infrastructure. Whether you're planning your first Puppet deployment or optimizing an existing one, this architectural knowledge will guide your decisions.

## 2.1 The Key Players: Components of a Puppet Environment

Puppet's architecture follows a client-server model with several specialized components working in concert. Let's examine each component and understand its role in the ecosystem.

### 2.1.1 The Puppet Server (Primary)

The Puppet Server (formerly known as the Puppet Master) is the central authority in your Puppet infrastructure. It serves as:

- **Catalog Compiler**: Transforms Puppet code into catalogs
- **File Server**: Distributes files to agents
- **Certificate Authority**: Manages SSL certificates (optional)
- **Report Processor**: Collects and processes agent reports

#### Architecture Deep Dive

The modern Puppet Server is a Clojure application running on the JVM, which provides:

```
┌─────────────────────────────────────────────────────┐
│                   Puppet Server                      │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   JRuby     │  │   Clojure    │  │   Jetty    │ │
│  │  Compilers  │  │  Services    │  │ Web Server │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
│  ┌─────────────────────────────────────────────────┐│
│  │                    JVM                           ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

Key features:
- **JRuby Isolation**: Each catalog compilation runs in its own JRuby instance
- **Connection Pooling**: Efficient handling of concurrent agent requests
- **Performance**: Dramatic improvements over the legacy Ruby-based master

#### Scaling Considerations

For large deployments, consider:

1. **Compile Masters**: Dedicated servers for catalog compilation
2. **Load Balancing**: Distribute agent requests across multiple servers
3. **Caching**: Leverage built-in caching for improved performance

Example architecture for scale:
```
                    ┌──────────────┐
                    │Load Balancer │
                    └──────┬───────┘
                ┌──────────┴──────────┐
                │                     │
        ┌───────▼────────┐   ┌───────▼────────┐
        │ Compile Master │   │ Compile Master │
        └────────────────┘   └────────────────┘
                │                     │
                └──────────┬──────────┘
                    ┌──────▼───────┐
                    │   PuppetDB   │
                    └──────────────┘
```

### 2.1.2 The Puppet Agent

The Puppet Agent runs on every managed node and is responsible for:

- **Fact Collection**: Gathering system information
- **Catalog Request**: Asking the server for its catalog
- **Catalog Application**: Enforcing the desired state
- **Report Submission**: Sending results back to the server

#### Agent Architecture

```
┌─────────────────────────────────────────┐
│            Puppet Agent Node            │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌──────────┐  ┌────────┐│
│  │ Facter  │  │  Agent   │  │Provider││
│  │         │  │  Daemon  │  │Plugins ││
│  └────┬────┘  └────┬─────┘  └────┬───┘│
│       │            │              │     │
│  ┌────▼────────────▼──────────────▼───┐│
│  │        Resource Abstraction         ││
│  │          Layer (RAL)                ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

#### The Agent Process

The agent can run in two modes:

1. **Daemon Mode**: Runs continuously, applying catalogs on schedule
   ```bash
   puppet agent --daemonize
   ```

2. **One-time Mode**: Runs once and exits
   ```bash
   puppet agent --test --noop  # Dry run
   puppet agent --test         # Apply changes
   ```

### 2.1.3 Facter: The Fact Gatherer

Facter is Puppet's system profiling library. It discovers and reports per-node facts that can be used in your Puppet code.

#### Core Facts

Facter provides numerous built-in facts:

```ruby
# System facts
$facts['os']['family']          # => 'RedHat'
$facts['os']['release']['full'] # => '7.9.2009'

# Network facts
$facts['networking']['hostname']    # => 'web01'
$facts['networking']['interfaces']  # => Hash of network interfaces

# Hardware facts
$facts['memory']['system']['total'] # => '16.00 GB'
$facts['processors']['count']       # => 8
```

#### Custom Facts

You can extend Facter with custom facts:

```ruby
# modules/myapp/lib/facter/app_version.rb
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

#### External Facts

For simpler cases, use external facts:

```bash
# /etc/puppetlabs/facter/facts.d/datacenter.txt
datacenter=us-east-1
rack_location=A14
```

### 2.1.4 PuppetDB: The Brain of Your Infrastructure Data

PuppetDB is a powerful data warehouse for Puppet, storing:

- **Facts**: Historical and current node facts
- **Catalogs**: Complete catalog data for each node
- **Reports**: Detailed information about each Puppet run
- **Resources**: Exported resources for cross-node configuration

#### PuppetDB Architecture

```
┌─────────────────────────────────────────────┐
│                  PuppetDB                    │
├─────────────────────────────────────────────┤
│  ┌──────────────┐  ┌───────────────────────┐│
│  │   REST API   │  │   PostgreSQL DB       ││
│  └──────┬───────┘  └───────────┬───────────┘│
│         │                       │             │
│  ┌──────▼───────────────────────▼──────────┐│
│  │         Command Processing              ││
│  │    (Facts, Catalogs, Reports)           ││
│  └─────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────┐│
│  │           Query Engine                  ││
│  │         (PQL - Puppet Query Language)    ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

#### Key Features

1. **Fast Queries**: Optimized for Puppet's query patterns
2. **Historical Data**: Maintains history for trending and analysis
3. **Exported Resources**: Enables cross-node resource sharing
4. **Rich Query Language**: PQL for complex queries

Example PQL queries:
```puppet
# Find all CentOS 7 nodes
nodes[certname] { facts.os.name = "CentOS" and facts.os.release.major = "7" }

# Find nodes with less than 4GB RAM
nodes[certname] { facts.memory.system.total_bytes < 4294967296 }

# Find all nodes with Apache installed
resources[certname] { type = "Package" and title = "httpd" }
```

### 2.1.5 The Certificate Authority (CA)

Puppet uses SSL certificates for all communications, ensuring:
- **Authentication**: Nodes prove their identity
- **Encryption**: All traffic is encrypted
- **Authorization**: Access control based on certificates

#### CA Architecture

```
┌────────────────────────────────────┐
│      Certificate Authority         │
├────────────────────────────────────┤
│  ┌─────────┐   ┌────────────────┐ │
│  │ Root CA │   │ Certificate    │ │
│  │  Cert   │   │ Signing Logic  │ │
│  └────┬────┘   └───────┬────────┘ │
│       │                 │          │
│  ┌────▼─────────────────▼────────┐│
│  │     Certificate Store         ││
│  │  • Signed certificates        ││
│  │  • Revocation lists          ││
│  │  • Pending requests          ││
│  └───────────────────────────────┘│
└────────────────────────────────────┘
```

#### Certificate Workflow

1. **Certificate Request**:
   ```bash
   # On agent node
   puppet agent --test --waitforcert 60
   ```

2. **Certificate Signing**:
   ```bash
   # On Puppet server
   puppetserver ca list              # View pending requests
   puppetserver ca sign --certname web01.example.com
   ```

3. **Certificate Revocation**:
   ```bash
   puppetserver ca revoke --certname compromised.example.com
   ```

#### Alternative CA Options

For advanced deployments:
- **External CA**: Use existing corporate CA
- **Intermediate CA**: Delegate signing to compile masters
- **Policy-based Autosigning**: Automate certificate approval

## 2.2 The Agent Run Cycle: A Step-by-Step Journey

Understanding the agent run cycle is essential for debugging and optimization. Let's trace through each step of a Puppet run.

### Complete Run Cycle

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Run Cycle                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. ┌─────────────┐        2. ┌──────────────────┐     │
│     │ Run Triggered│ ─────────▶│ Gather Facts     │     │
│     └─────────────┘           └────────┬─────────┘     │
│                                         │                │
│                               3. ┌──────▼─────────┐     │
│                                  │ Send Facts to  │     │
│                                  │    Server      │     │
│                                  └──────┬─────────┘     │
│                                         │                │
│                               4. ┌──────▼─────────┐     │
│                          ┌───────│Server Compiles │     │
│                          │       │    Catalog     │     │
│                          │       └────────────────┘     │
│                          │                               │
│                 5. ┌─────▼─────────┐                   │
│                    │ Receive       │                    │
│                    │  Catalog      │                    │
│                    └─────┬─────────┘                   │
│                          │                               │
│                 6. ┌─────▼─────────┐                   │
│                    │ Apply Catalog │                    │
│                    │  (RAL)        │                    │
│                    └─────┬─────────┘                   │
│                          │                               │
│                 7. ┌─────▼─────────┐                   │
│                    │ Send Report   │                    │
│                    │  to Server    │                    │
│                    └───────────────┘                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Detailed Step Analysis

#### Step 1: Run Triggered

A Puppet run can be triggered by:
- **Scheduled runs**: Default every 30 minutes
- **Manual execution**: `puppet agent --test`
- **Orchestrated runs**: Via Puppet Enterprise console
- **Event-driven**: External triggers (MCollective, Bolt)

#### Step 2: Gather Facts

Facter collects system information:
```ruby
# What happens internally
facts = {}
facts['hostname'] = `hostname`.strip
facts['kernel'] = `uname -s`.strip
# ... hundreds more facts
```

#### Step 3: Send Facts to Server

The agent sends facts via HTTPS POST:
```
POST /puppet/v3/catalog/web01.example.com?environment=production
Content-Type: application/json

{
  "facts": {
    "hostname": "web01",
    "os": {
      "family": "RedHat",
      "release": {
        "major": "7",
        "minor": "9"
      }
    }
    // ... more facts
  }
}
```

#### Step 4: Server Compiles Catalog

The server:
1. **Loads node classification**: Determines which classes to apply
2. **Evaluates Puppet code**: Processes manifests and modules
3. **Resolves dependencies**: Orders resources properly
4. **Generates catalog**: Creates JSON representation

Example catalog structure:
```json
{
  "version": "1234567890",
  "environment": "production",
  "resources": [
    {
      "type": "Package",
      "title": "nginx",
      "parameters": {
        "ensure": "installed"
      }
    },
    {
      "type": "Service",
      "title": "nginx",
      "parameters": {
        "ensure": "running",
        "enable": true
      }
    }
  ],
  "edges": [
    {
      "source": "Package[nginx]",
      "target": "Service[nginx]"
    }
  ]
}
```

#### Step 5: Receive Catalog

The agent:
- Downloads the catalog
- Validates catalog integrity
- Caches for offline use (if configured)

#### Step 6: Apply Catalog (RAL)

The Resource Abstraction Layer (RAL) is where the magic happens:

```ruby
# Pseudo-code of RAL operation
catalog.resources.each do |resource|
  current_state = resource.retrieve
  desired_state = resource.should

  if current_state != desired_state
    resource.sync
    log_change(resource, current_state, desired_state)
  end
end
```

Key RAL features:
- **Provider selection**: Chooses appropriate provider per platform
- **Transaction wrapping**: Ensures atomic operations where possible
- **Relationship ordering**: Respects resource dependencies

#### Step 7: Send Report

The agent generates a detailed report:
```yaml
---
host: web01.example.com
time: 2023-11-15 10:30:45 UTC
environment: production
status: changed
metrics:
  resources:
    total: 247
    changed: 3
    failed: 0
  time:
    total: 15.234
    config_retrieval: 1.234
    catalog_application: 14.000
events:
  - resource: Package[nginx]
    message: "ensured installed"
    status: success
  - resource: File[/etc/nginx/nginx.conf]
    message: "content changed '{md5}abc123' to '{md5}def456'"
    status: success
```

### Optimizing the Run Cycle

#### Performance Tuning

1. **Fact caching**: Reduce fact collection overhead
   ```puppet
   # puppet.conf
   [agent]
   facts_terminus = facter
   facts_cache_terminus = json
   ```

2. **Catalog caching**: Enable offline runs
   ```puppet
   [agent]
   use_cached_catalog = true
   ```

3. **Run interval adjustment**: Balance freshness vs. load
   ```puppet
   [agent]
   runinterval = 1h  # Default is 30m
   ```

#### Monitoring and Alerting

Key metrics to monitor:
- **Run time**: Catalog compilation and application
- **Resource changes**: Unexpected changes may indicate drift
- **Failures**: Failed resources requiring attention
- **Last run time**: Identify agents not checking in

## 2.3 Open Source Puppet vs. Puppet Enterprise (PE)

While the core Puppet technology is the same, Puppet Enterprise adds significant value for organizations requiring enterprise features.

### Feature Comparison

| Feature | Open Source | Puppet Enterprise |
|---------|-------------|-------------------|
| Core Puppet Language | ✓ | ✓ |
| Puppet Server | ✓ | ✓ |
| PuppetDB | ✓ | ✓ |
| Facter | ✓ | ✓ |
| **Additional Features** | | |
| Web Console | ✗ | ✓ |
| Role-Based Access Control | ✗ | ✓ |
| Orchestration | Limited (Bolt) | Full |
| Code Manager | ✗ | ✓ |
| Node Classification GUI | ✗ | ✓ |
| Official Support | Community | Commercial |
| Performance Tuning | Manual | Automated |
| Compliance Reporting | ✗ | ✓ |

### Puppet Enterprise Architecture

PE adds several components:

```
┌──────────────────────────────────────────────────┐
│              Puppet Enterprise                    │
├──────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────┐│
│  │  PE Console │  │     Code      │  │  Node   ││
│  │   (Web UI)  │  │   Manager     │  │Classifier││
│  └──────┬──────┘  └───────┬──────┘  └────┬────┘│
│         │                  │               │      │
│  ┌──────▼──────────────────▼───────────────▼───┐│
│  │            Puppet Server + PuppetDB          ││
│  └──────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────┐│
│  │           Orchestration Services             ││
│  │         (PXP Agent, Orchestrator)            ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

### When to Choose PE

Consider Puppet Enterprise when you need:

1. **Scale**: Managing thousands of nodes
2. **Compliance**: Audit trails and reporting
3. **Team Collaboration**: Multiple teams managing infrastructure
4. **Support**: SLA-backed commercial support
5. **Rapid Deployment**: Pre-tuned and integrated components

### Migration Path

Moving from Open Source to PE:
1. PE uses the same Puppet code
2. Existing modules work without modification
3. Migration tools available
4. Can run in parallel during transition

## Architecture Best Practices

### High Availability

For production deployments:

1. **Active/Passive Puppet Servers**: Failover capability
2. **PostgreSQL Replication**: For PuppetDB resilience
3. **Load Balancing**: Distribute agent connections
4. **Monitoring**: Comprehensive health checks

Example HA architecture:
```
                    ┌─────────────────┐
                    │   VIP/LB        │
                    └────────┬────────┘
                ┌────────────┴────────────┐
        ┌───────▼────────┐      ┌────────▼───────┐
        │ Puppet Server  │      │ Puppet Server  │
        │   (Active)     │      │  (Passive)     │
        └───────┬────────┘      └────────────────┘
                │
        ┌───────▼────────┐
        │   PuppetDB     │
        │  (Primary)     │
        └───────┬────────┘
                │ Streaming
                │ Replication
        ┌───────▼────────┐
        │   PuppetDB     │
        │  (Replica)     │
        └────────────────┘
```

### Security Hardening

Essential security measures:

1. **Certificate Management**:
   - Short certificate lifetimes
   - Automated certificate deployment
   - Regular CA key rotation

2. **Network Security**:
   - Firewall rules limiting access
   - Encrypted communications only
   - Network segmentation

3. **Access Control**:
   - Limit sudo access on Puppet server
   - Restrict file permissions
   - Audit logging enabled

### Disaster Recovery

Prepare for the worst:

1. **Backup Strategy**:
   - Puppet code (Git)
   - Certificates
   - PuppetDB data
   - Hiera data

2. **Recovery Procedures**:
   - Documented rebuild process
   - Tested restore procedures
   - RTO/RPO defined

## Summary

Puppet's architecture is elegantly designed to solve real-world infrastructure management challenges. Understanding how components interact enables you to:

- Design scalable Puppet deployments
- Troubleshoot issues effectively
- Optimize performance
- Plan for growth

The client-server model, with specialized components for facts, data storage, and certificate management, provides a robust foundation for infrastructure as code. Whether using Open Source Puppet or Puppet Enterprise, the architectural principles remain consistent, allowing you to start small and scale as needed.

In the next chapter, we'll explore the Puppet language itself, learning how to write code that leverages this architecture to manage your infrastructure effectively.

## Key Takeaways

- The Puppet Server compiles catalogs using facts from agents
- Facter provides system information for decision-making
- PuppetDB stores all infrastructure data for querying and reporting
- The Certificate Authority ensures secure communications
- The agent run cycle is predictable and debuggable
- Puppet Enterprise adds enterprise features while maintaining compatibility
- Architecture decisions impact scalability and reliability

## Lab Exercises

1. **Install Puppet Server and Agent**: Set up a basic Puppet environment
2. **Explore Facts**: Use `facter` to see available facts on your system
3. **Trace a Puppet Run**: Use `--debug` to follow the complete run cycle
4. **Query PuppetDB**: Write PQL queries to explore your infrastructure data
5. **Certificate Management**: Practice signing and revoking certificates

## Further Reading

- "Pro Puppet" by Spencer Krum, William Van Hevelingen, et al.
- Puppet's Architecture Documentation
- PuppetDB Query Tutorial
- Puppet Enterprise Architecture Guide