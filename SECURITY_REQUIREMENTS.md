# Security Requirements for Contract Data

## Frontend Implementation ✅

The frontend now implements client-side data redaction for sensitive information displayed in the ContractDetailSheet component.

### Protected Data Types

1. **Sensitive Placeholder Values** (automatically detected and redacted):
   - Social Security Numbers (ssn, social_security, tax_id, ein, tin)
   - Bank Account Information (bank_account, account_number, routing_number, iban, swift)
   - Payment Card Data (card_number, cvv, credit_card)
   - Authentication Data (password, secret, api_key, token)
   - Government IDs (passport, id_number, driver_license, license_number)
   - Personal Information (birth_date, dob, date_of_birth)
   - Financial Information (salary, compensation, advance, payment_amount)
   - Contact Information (phone, mobile, telephone, address, street, postal_code, zip_code)

2. **Email Addresses** (partially masked):
   - Creator email: `jo******@example.com` (shows first 2 chars + domain)
   - Signer emails: Same masking pattern

### Display Behavior

- Sensitive fields show: `ab********cd` (first 2 + asterisks + last 2)
- Emails show: `ab******@domain.com` (first 2 chars of local part)
- Sensitive fields marked with 🔒 eye-off icon

## Backend Requirements ⚠️ TO BE IMPLEMENTED

The backend **MUST** implement server-side filtering to prevent sensitive data from being transmitted over the network.

### Required Backend Changes

#### 1. Contract API Endpoint (`/api/v1/contracts/{id}/`)

**Current Behavior**: Returns full `placeholder_values` object with all data.

**Required Behavior**: Filter sensitive fields from `placeholder_values` before sending to frontend.

```python
# Example Django implementation
SENSITIVE_FIELD_PATTERNS = [
    'ssn', 'social_security', 'tax_id', 'ein', 'tin',
    'bank_account', 'account_number', 'routing_number', 'iban', 'swift',
    'card_number', 'cvv', 'credit_card',
    'password', 'secret', 'api_key', 'token',
    'passport', 'id_number', 'driver_license', 'license_number',
    'birth_date', 'dob', 'date_of_birth',
    'salary', 'compensation', 'advance', 'payment_amount',
    'phone', 'mobile', 'telephone',
    'address', 'street', 'postal_code', 'zip_code',
]

def is_sensitive_field(field_name: str) -> bool:
    """Check if field contains sensitive data pattern."""
    field_lower = field_name.lower()
    return any(pattern in field_lower for pattern in SENSITIVE_FIELD_PATTERNS)

def redact_placeholder_values(placeholder_values: dict) -> dict:
    """Remove sensitive fields from placeholder values."""
    return {
        key: '***REDACTED***' if is_sensitive_field(key) else value
        for key, value in placeholder_values.items()
    }

# In ContractSerializer or view
def to_representation(self, instance):
    data = super().to_representation(instance)
    data['placeholder_values'] = redact_placeholder_values(
        data.get('placeholder_values', {})
    )
    return data
```

#### 2. Contracts List Endpoint (`/api/v1/contracts/`)

**Current Behavior**: May include full placeholder_values in list response.

**Required Behavior**:
- Remove `placeholder_values` entirely from list responses (not needed in table view)
- OR apply same redaction as detail endpoint

```python
# In ContractSerializer
class ContractSerializer(serializers.ModelSerializer):
    class Meta:
        fields = [
            'id', 'contract_number', 'title', 'status',
            'template_name', 'created_at', 'created_by_email',
            # EXCLUDE: 'placeholder_values' from list view
        ]
```

#### 3. Audit Trail Endpoint (`/api/v1/contracts/{id}/audit_trail/`)

**Current Behavior**: May expose sensitive data in `changes` field of audit events.

**Required Behavior**: Redact sensitive fields from audit event changes.

```python
def redact_audit_changes(changes: dict) -> dict:
    """Redact sensitive data from audit trail changes."""
    if not changes:
        return changes

    redacted = {}
    for key, value in changes.items():
        if is_sensitive_field(key):
            if isinstance(value, dict):
                # For old/new value pairs
                redacted[key] = {k: '***REDACTED***' for k in value.keys()}
            else:
                redacted[key] = '***REDACTED***'
        else:
            redacted[key] = value

    return redacted

# Apply to audit events before serialization
for event in audit_events:
    if event.get('changes'):
        event['changes'] = redact_audit_changes(event['changes'])
```

#### 4. Email Address Masking (Optional but Recommended)

**Current Behavior**: Full email addresses exposed in API responses.

**Recommended Behavior**: Mask email addresses server-side for additional security layer.

```python
def mask_email(email: str) -> str:
    """Mask email address for privacy."""
    if '@' not in email:
        return email

    local, domain = email.split('@', 1)
    masked_local = local[:2] + '*' * min(len(local) - 2, 6) if len(local) > 2 else local
    return f"{masked_local}@{domain}"

# Apply to serializers
class ContractSerializer(serializers.ModelSerializer):
    created_by_email = serializers.SerializerMethodField()

    def get_created_by_email(self, obj):
        return mask_email(obj.created_by.email)
```

### Security Checklist

Backend developers should implement:

- [ ] Filter sensitive fields from `placeholder_values` in contract detail endpoint
- [ ] Remove or redact `placeholder_values` from contracts list endpoint
- [ ] Redact sensitive data from audit trail `changes` field
- [ ] Consider masking email addresses server-side
- [ ] Add unit tests for redaction functions
- [ ] Document which fields are considered sensitive in backend code
- [ ] Ensure redaction happens at serialization level (not just view level)
- [ ] Consider adding a permission check: only contract owners/signers/admins see unredacted data
- [ ] Log access to sensitive contract data for compliance

### Why Both Frontend AND Backend?

1. **Defense in Depth**: Multiple layers of security
2. **Network Traffic**: Backend filtering reduces sensitive data transmission
3. **API Security**: Prevents accidental exposure via API tools/debugging
4. **Compliance**: Many regulations (GDPR, HIPAA, PCI-DSS) require server-side data protection
5. **Frontend Bypass**: Malicious users can bypass frontend, so backend is critical

### Priority

🔴 **HIGH PRIORITY** - Implement backend filtering immediately. Frontend masking is a temporary measure and should NOT be relied upon as the sole protection mechanism.
