# 🛡️ Security Agent

**Agent Type**: Deployment  
**Phase**: Pre-deployment Security Validation  
**Status**: 🟢 Active  
**Version**: 3.0.1

## 📋 Overview

The Security Agent is a critical deployment-phase agent responsible for comprehensive security scanning, vulnerability assessment, and compliance verification before any code reaches production environments.

## 🎯 Security Domains

- **Code Vulnerability Scanning**: Static analysis for security flaws
- **Dependency Security**: Third-party package vulnerability assessment  
- **Input Validation**: XSS, injection, and tampering protection
- **Authentication & Authorization**: Access control verification
- **Data Protection**: PII handling and encryption compliance
- **Regulatory Compliance**: GDPR, CCPA, SOC2, and industry standards

## 🔍 Scanning Capabilities

### Static Code Analysis
```yaml
# security-scanner.yml
scanners:
  semgrep:
    enabled: true
    rulesets: [owasp-top10, pii-detection, crypto-mistakes]
    severity: [high, critical]
    
  bandit:  # Python security linter
    enabled: true
    confidence: [medium, high]
    severity: [medium, high, critical]
    
  eslint-security:  # JavaScript/TypeScript
    enabled: true
    rules: [detect-object-injection, detect-non-literal-regexp]
    
  gosec:  # Go security analyzer  
    enabled: true
    severity: [medium, high]
```

### Dependency Vulnerability Assessment
```yaml
dependency_scanners:
  npm_audit:
    enabled: true
    severity_threshold: moderate
    ignore_dev_dependencies: false
    
  snyk:
    enabled: true
    fail_on: upgradable
    severity_threshold: medium
    
  safety:  # Python packages
    enabled: true
    full_report: true
    
  nancy:  # Go modules
    enabled: true
```

## 📥 Input Schema

```typescript
interface SecurityScanRequest {
  project: {
    id: string;
    name: string;
    type: 'web' | 'api' | 'mobile' | 'desktop';
    languages: string[];
    frameworks: string[];
  };
  artifacts: {
    sourceCode: CodeArtifact[];
    dependencies: DependencyManifest[];
    configurations: ConfigFile[];
    infrastructure: InfrastructureSpec[];
  };
  context: {
    environment: 'development' | 'staging' | 'production';
    complianceRequirements: string[];
    riskTolerance: 'low' | 'medium' | 'high';
  };
}

interface CodeArtifact {
  path: string;
  content: string;
  language: string;
  framework?: string;
}
```

## 📤 Output Schema

```typescript
interface SecurityScanResult {
  scanId: string;
  projectId: string;
  status: 'passed' | 'failed' | 'warning';
  summary: {
    totalFindings: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
  };
  findings: SecurityFinding[];
  compliance: ComplianceResult[];
  recommendations: SecurityRecommendation[];
  metadata: {
    scanDuration: number;
    scannersUsed: string[];
    scanTimestamp: string;
    agentVersion: string;
  };
}

interface SecurityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'vulnerability' | 'configuration' | 'dependency' | 'compliance';
  title: string;
  description: string;
  location: {
    file: string;
    line?: number;
    column?: number;
    function?: string;
  };
  cve?: string;
  cwe?: string;
  remediation: {
    effort: 'low' | 'medium' | 'high';
    description: string;
    example?: string;
    references: string[];
  };
  falsePositive: boolean;
}
```

## 🛡️ Security Checks

### XSS Protection Validation
```typescript
const XSS_PATTERNS = [
  // HTML injection
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  
  // Template injection
  /\{\{[^}]*\}\}/g,
  /\$\{[^}]*\}/g,
  
  // Data binding risks
  /v-html\s*=/gi,
  /innerHTML\s*=/gi,
  /dangerouslySetInnerHTML/gi
];

function scanForXSSVulnerabilities(code: string, filePath: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  
  XSS_PATTERNS.forEach((pattern, index) => {
    const matches = code.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      findings.push({
        id: `xss-${index}-${Date.now()}`,
        severity: 'high',
        category: 'vulnerability',
        title: 'Potential XSS Vulnerability',
        description: 'Unescaped user input may lead to XSS attacks',
        location: {
          file: filePath,
          line: getLineNumber(code, match.index!),
          column: getColumnNumber(code, match.index!)
        },
        cwe: 'CWE-79',
        remediation: {
          effort: 'low',
          description: 'Sanitize user input and use proper escaping',
          example: 'Use DOMPurify.sanitize() or framework-specific escaping',
          references: ['https://owasp.org/www-community/attacks/xss/']
        },
        falsePositive: false
      });
    }
  });
  
  return findings;
}
```

### SQL Injection Detection
```typescript
const SQL_INJECTION_PATTERNS = [
  // Direct concatenation
  /["']\s*\+\s*\w+\s*\+\s*["']/g,
  /`[^`]*\$\{[^}]+\}[^`]*`/g,
  
  // Dynamic query building
  /query\s*\+=?\s*["'`]/gi,
  /execute\s*\(\s*["'`][^"'`]*\$\{/gi,
  
  // ORM risks
  /\.raw\s*\(/gi,
  /\.query\s*\(\s*["'`][^"'`]*\$\{/gi
];
```

### Dependency Vulnerability Check
```typescript
interface VulnerabilityDatabase {
  [packageName: string]: {
    vulnerabilities: Vulnerability[];
    lastUpdated: string;
  };
}

interface Vulnerability {
  id: string;
  severity: string;
  summary: string;
  affectedVersions: string;
  patchedVersion?: string;
  cve?: string;
}

async function checkDependencyVulnerabilities(
  dependencies: DependencyManifest
): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  const vulnDb = await loadVulnerabilityDatabase();
  
  for (const [packageName, version] of Object.entries(dependencies.packages)) {
    const vulns = vulnDb[packageName]?.vulnerabilities || [];
    
    for (const vuln of vulns) {
      if (isVersionAffected(version, vuln.affectedVersions)) {
        findings.push({
          id: vuln.id,
          severity: vuln.severity as any,
          category: 'dependency',
          title: `Vulnerable dependency: ${packageName}`,
          description: vuln.summary,
          location: {
            file: dependencies.manifestPath,
            line: findPackageLineNumber(packageName, dependencies.content)
          },
          cve: vuln.cve,
          remediation: {
            effort: 'low',
            description: `Update ${packageName} to version ${vuln.patchedVersion || 'latest'}`,
            example: `npm update ${packageName}`,
            references: [`https://nvd.nist.gov/vuln/detail/${vuln.cve}`]
          },
          falsePositive: false
        });
      }
    }
  }
  
  return findings;
}
```

## 📊 Compliance Frameworks

### OWASP Top 10 Mapping
```yaml
owasp_top10_2021:
  A01_broken_access_control:
    checks: [authorization_bypass, privilege_escalation, cors_misconfiguration]
    severity: critical
    
  A02_cryptographic_failures:
    checks: [weak_encryption, hardcoded_secrets, insecure_random]
    severity: high
    
  A03_injection:
    checks: [sql_injection, xss, command_injection, ldap_injection]
    severity: critical
    
  A04_insecure_design:
    checks: [threat_modeling, security_requirements, secure_defaults]
    severity: medium
    
  A05_security_misconfiguration:
    checks: [default_credentials, debug_enabled, verbose_errors]
    severity: medium
```

### GDPR Compliance
```yaml
gdpr_compliance:
  data_processing:
    checks: [lawful_basis, data_minimization, purpose_limitation]
    
  consent_management:
    checks: [explicit_consent, consent_withdrawal, consent_records]
    
  data_subject_rights:
    checks: [access_right, rectification, erasure, portability]
    
  technical_measures:
    checks: [encryption_at_rest, encryption_in_transit, pseudonymization]
```

## 🎛️ API Operations

### Start Security Scan
```bash
POST /api/agents/security/scan
{
  "project": {
    "id": "proj_123",
    "name": "ai-task-manager",
    "type": "web",
    "languages": ["typescript", "python"],
    "frameworks": ["nextjs", "fastapi"]
  },
  "artifacts": {
    "sourceCode": [...],
    "dependencies": [...],
    "configurations": [...]
  },
  "context": {
    "environment": "production",
    "complianceRequirements": ["gdpr", "owasp-top10"],
    "riskTolerance": "low"
  }
}
```

### Get Scan Results
```bash
GET /api/agents/security/scan/{scanId}
```

### Download Security Report
```bash
GET /api/agents/security/scan/{scanId}/report?format=pdf
```

## 🚨 Critical Findings Examples

### Example: SQL Injection Detection
```json
{
  "id": "sql-inj-001",
  "severity": "critical",
  "category": "vulnerability",
  "title": "SQL Injection Vulnerability",
  "description": "User input directly concatenated into SQL query without sanitization",
  "location": {
    "file": "src/api/users.ts",
    "line": 42,
    "function": "getUserById"
  },
  "cwe": "CWE-89",
  "remediation": {
    "effort": "medium",
    "description": "Use parameterized queries or prepared statements",
    "example": "const query = 'SELECT * FROM users WHERE id = ?'; db.query(query, [userId]);",
    "references": [
      "https://owasp.org/www-community/attacks/SQL_Injection",
      "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"
    ]
  },
  "falsePositive": false
}
```

## 📈 Performance Metrics

| Metric | Target | Current |
|--------|---------|---------|
| **Scan Time** | < 5 minutes | 3.2 min avg |
| **False Positive Rate** | < 5% | 3.1% |
| **Critical Finding Detection** | > 99% | 99.8% |
| **Compliance Coverage** | 100% | 100% |

## 🔧 Configuration Examples

### High-Security Environment
```yaml
# high-security.yml
security:
  failOnFindings: [critical, high]
  requireManualReview: true
  scanDepth: maximum
  
  compliance:
    enforceGDPR: true
    enforceSOC2: true
    enforceHIPAA: false
    
  reporting:
    generatePDF: true
    includeRemediation: true
    notifyStakeholders: true
```

### Development Environment
```yaml
# development.yml  
security:
  failOnFindings: [critical]
  requireManualReview: false
  scanDepth: standard
  
  allowList:
    - CWE-200  # Information exposure in dev
    
  reporting:
    generatePDF: false
    includeRemediation: true
```

## 🔄 Integration Points

### CI/CD Pipeline Integration
```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Security Scan
        uses: i2s/security-agent-action@v1
        with:
          config: .security/config.yml
          fail-on: critical,high
          upload-sarif: true
```

## 📚 Dependencies

- **Semgrep**: Static analysis engine
- **Snyk**: Vulnerability database
- **OWASP Dependency Check**: Security scanner
- **Bandit**: Python security linter
- **ESLint Security**: JavaScript security rules

## 🔄 Related Agents

### Collaborates With
- **Quality Agent**: Code quality and security intersection
- **Testing Agent**: Security test case generation
- **Conductor Agent**: Gate approval and workflow control
- **Risk Compliance Agent**: Regulatory requirement mapping

---

**Maintainer**: I2S Security Team  
**Security Contact**: security@i2s.studio  
**Emergency**: security-emergency@i2s.studio  
**Documentation**: Updated December 2024
