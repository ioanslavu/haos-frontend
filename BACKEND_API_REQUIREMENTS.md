# Digital Financial Backend API Requirements

## Overview
This document specifies the backend API endpoints required for the Digital Financial feature. All calculations, aggregations, and currency conversions **MUST** be done on the backend. The frontend should only fetch and display pre-computed data.

## Security & Authorization

### Authentication
All endpoints require:
- ✅ Valid session token (httpOnly cookie)
- ✅ CSRF token validation
- ✅ User must be authenticated

### Authorization
Additional requirements:
- ✅ User must have access to the Digital department
- ✅ Use permission-based access control (check user's department memberships)
- ✅ Consider implementing role-based restrictions for sensitive financial data

Example Django implementation:
```python
from rest_framework.permissions import BasePermission

class HasDigitalDepartmentAccess(BasePermission):
    """
    Only allow users who belong to the Digital department
    """
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has digital department access
        # Adjust this based on your user-department relationship
        digital_dept = Department.objects.filter(name='Digital').first()
        if not digital_dept:
            return False

        return request.user.departments.filter(id=digital_dept.id).exists()
```

## Required Endpoints

### 1. Financial Metrics Overview
**Endpoint**: `GET /api/v1/digital/financial/metrics/`

**Purpose**: Return aggregated financial metrics for the overview cards

**Query Parameters**:
- `start_date` (optional): ISO date string (YYYY-MM-DD)
- `end_date` (optional): ISO date string (YYYY-MM-DD)
- `period` (optional): `7d`, `30d`, `90d`, `year`, `custom`
- `service_type` (optional): Filter by service type
- `status` (optional): Filter by campaign status
- `invoice_status` (optional): Filter by invoice status

**Response**:
```json
{
  "total_revenue": 125000.50,
  "total_profit": 45000.25,
  "total_budget_spent": 80000.25,
  "pending_collections": 35000.00,
  "profit_margin": 36.0
}
```

**Backend Implementation**:
```python
# Use Django ORM aggregations
from django.db.models import Sum, F, ExpressionWrapper, FloatField, Q

def get_financial_metrics(queryset):
    # Filter campaigns by date range, status, etc.
    campaigns = queryset.filter(...)

    # Convert all amounts to EUR first (using exchange rates)
    # Then aggregate
    metrics = campaigns.aggregate(
        total_revenue=Sum('value_eur'),
        total_profit=Sum('profit'),
        total_budget_spent=Sum('budget_spent_eur'),
        pending_collections=Sum(
            'value_eur',
            filter=Q(invoice_status__in=['issued', 'delayed'])
        )
    )

    # Calculate profit margin
    if metrics['total_revenue'] and metrics['total_revenue'] > 0:
        metrics['profit_margin'] = (
            metrics['total_profit'] / metrics['total_revenue']
        ) * 100
    else:
        metrics['profit_margin'] = 0

    return metrics
```

**Database Optimization**:
- Add indexes on: `start_date`, `service_type`, `status`, `invoice_status`
- Consider materialized views for frequently accessed date ranges
- Cache exchange rates (update hourly/daily)

---

### 2. Monthly Revenue Breakdown
**Endpoint**: `GET /api/v1/digital/financial/revenue-by-month/`

**Purpose**: Return revenue, profit, and expenses grouped by month

**Query Parameters**: Same as endpoint #1

**Response**:
```json
[
  {
    "month": "Jan 2024",
    "revenue": 45000.50,
    "profit": 15000.25,
    "spent": 30000.25
  },
  {
    "month": "Feb 2024",
    "revenue": 52000.75,
    "profit": 18000.50,
    "spent": 34000.25
  }
]
```

**Backend Implementation**:
```python
from django.db.models.functions import TruncMonth

def get_monthly_revenue(queryset):
    return queryset.annotate(
        month=TruncMonth('start_date')
    ).values('month').annotate(
        revenue=Sum('value_eur'),
        profit=Sum('profit'),
        spent=Sum('budget_spent_eur')
    ).order_by('month')
```

---

### 3. Revenue by Service Type
**Endpoint**: `GET /api/v1/digital/financial/revenue-by-service/`

**Purpose**: Return revenue grouped by service type

**Query Parameters**: Same as endpoint #1

**Response**:
```json
[
  {
    "service": "ppc",
    "service_display": "PPC Campaign",
    "revenue": 85000.50,
    "campaign_count": 15
  },
  {
    "service": "tiktok_ugc",
    "service_display": "TikTok UGC",
    "revenue": 45000.25,
    "campaign_count": 8
  }
]
```

**Backend Implementation**:
```python
def get_revenue_by_service(queryset):
    return queryset.values('service_type').annotate(
        revenue=Sum('value_eur'),
        campaign_count=Count('id')
    ).order_by('-revenue')
```

---

### 4. Top Clients by Revenue
**Endpoint**: `GET /api/v1/digital/financial/revenue-by-client/`

**Purpose**: Return top 5 clients by revenue

**Query Parameters**: Same as endpoint #1

**Response**:
```json
[
  {
    "client_id": 123,
    "client_name": "Warner Music",
    "revenue": 125000.50,
    "campaign_count": 12
  },
  {
    "client_id": 456,
    "client_name": "Universal Music",
    "revenue": 98000.25,
    "campaign_count": 8
  }
]
```

**Backend Implementation**:
```python
def get_top_clients(queryset):
    return queryset.values(
        'client__id',
        'client__display_name'
    ).annotate(
        revenue=Sum('value_eur'),
        campaign_count=Count('id')
    ).order_by('-revenue')[:5]
```

---

### 5. Campaign Financial Details
**Endpoint**: `GET /api/v1/digital/financial/campaigns/`

**Purpose**: Return paginated list of campaigns with all financial data

**Query Parameters**: Same as endpoint #1 + pagination

**Response**:
```json
{
  "count": 150,
  "next": "http://api.../campaigns/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "campaign_name": "Q1 TikTok Campaign",
      "client_id": 123,
      "client_name": "Warner Music",
      "service_type": "tiktok_ugc",
      "service_type_display": "TikTok UGC",

      "value_eur": 5000.00,
      "budget_spent_eur": 3500.00,
      "profit_eur": 1500.00,
      "internal_cost_estimate_eur": 500.00,

      "original_currency": "USD",
      "original_value": 5400.00,
      "original_budget_spent": 3780.00,
      "original_profit": 1620.00,
      "original_internal_cost": 540.00,

      "invoice_status": "issued",
      "campaign_status": "active",
      "start_date": "2024-01-15",
      "end_date": "2024-03-15"
    }
  ]
}
```

**Backend Implementation**:
```python
class CampaignFinancialSerializer(serializers.ModelSerializer):
    # EUR converted values (use current exchange rate)
    value_eur = serializers.SerializerMethodField()
    budget_spent_eur = serializers.SerializerMethodField()
    profit_eur = serializers.SerializerMethodField()
    internal_cost_estimate_eur = serializers.SerializerMethodField()

    # Original values
    original_currency = serializers.CharField(source='currency')
    original_value = serializers.DecimalField(source='value', ...)
    original_budget_spent = serializers.DecimalField(source='budget_spent', ...)

    def get_value_eur(self, obj):
        return convert_to_eur(obj.value, obj.currency)

    # ... similar for other fields
```

---

## Currency Conversion Service

### Requirements
1. **Exchange Rate Source**: Use a reliable API (e.g., exchangerate-api.io, ECB API)
2. **Caching**: Cache exchange rates in Redis with TTL (update daily or hourly)
3. **Fallback**: Have fallback rates in case API is down
4. **Audit**: Log all currency conversions for audit trail

### Example Implementation
```python
import redis
import requests
from decimal import Decimal

class CurrencyConverter:
    def __init__(self):
        self.redis_client = redis.Redis(...)
        self.cache_ttl = 3600  # 1 hour

    def get_exchange_rate(self, from_currency, to_currency='EUR'):
        """Get exchange rate with Redis caching"""
        cache_key = f"exchange_rate:{from_currency}:{to_currency}"

        # Try cache first
        cached_rate = self.redis_client.get(cache_key)
        if cached_rate:
            return Decimal(cached_rate)

        # Fetch from API
        try:
            response = requests.get(
                f"https://api.exchangerate-api.io/v4/latest/{from_currency}"
            )
            data = response.json()
            rate = Decimal(str(data['rates'][to_currency]))

            # Cache the rate
            self.redis_client.setex(
                cache_key,
                self.cache_ttl,
                str(rate)
            )
            return rate
        except Exception as e:
            # Fallback to hardcoded rates
            return self.get_fallback_rate(from_currency, to_currency)

    def convert(self, amount, from_currency, to_currency='EUR'):
        """Convert amount from one currency to another"""
        if from_currency == to_currency:
            return amount

        rate = self.get_exchange_rate(from_currency, to_currency)
        return amount * rate
```

---

## Database Schema Requirements

### New/Modified Fields on Campaign Model
```python
class Campaign(models.Model):
    # Existing fields...

    # New financial fields
    profit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Auto-calculated: value - budget_spent"
    )

    internal_cost_estimate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Estimated internal costs"
    )

    invoice_status = models.CharField(
        max_length=20,
        choices=[
            ('issued', 'Issued (Emisă)'),
            ('collected', 'Collected (Încasată)'),
            ('delayed', 'Delayed (Întârziată)'),
        ],
        null=True,
        blank=True
    )

    # Indexes for performance
    class Meta:
        indexes = [
            models.Index(fields=['start_date']),
            models.Index(fields=['service_type']),
            models.Index(fields=['status']),
            models.Index(fields=['invoice_status']),
            models.Index(fields=['start_date', 'service_type']),
        ]
```

---

## Performance Considerations

### 1. Database Optimization
- Use `select_related()` and `prefetch_related()` for queries
- Add database indexes on frequently filtered fields
- Consider denormalization for frequently accessed data
- Use database views for complex aggregations

### 2. Caching Strategy
```python
from django.core.cache import cache

def get_financial_metrics(filters):
    cache_key = f"financial_metrics:{hash(frozenset(filters.items()))}"

    # Try cache
    cached = cache.get(cache_key)
    if cached:
        return cached

    # Calculate
    metrics = calculate_metrics(filters)

    # Cache for 5 minutes
    cache.set(cache_key, metrics, 300)
    return metrics
```

### 3. Rate Limiting
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '1000/hour',
        'financial': '100/hour',  # More restrictive for financial endpoints
    }
}
```

---

## Testing Requirements

### Unit Tests
```python
def test_financial_metrics_calculation():
    """Test that metrics are calculated correctly"""
    # Create test campaigns
    campaign1 = Campaign.objects.create(
        value=1000, currency='EUR', budget_spent=700
    )
    campaign2 = Campaign.objects.create(
        value=2000, currency='USD', budget_spent=1400
    )

    # Get metrics
    metrics = get_financial_metrics(Campaign.objects.all())

    # Assert correct calculations
    assert metrics['total_revenue'] > 0
    assert metrics['profit_margin'] > 0
```

### Integration Tests
- Test all endpoints with various filter combinations
- Test currency conversion accuracy
- Test caching behavior
- Test authorization (unauthorized users should get 403)

---

## Monitoring & Logging

### Required Metrics
1. **Endpoint Response Times**: Track P50, P95, P99
2. **Cache Hit Rate**: Monitor Redis cache effectiveness
3. **Currency Conversion Errors**: Alert on API failures
4. **Query Performance**: Log slow database queries (>500ms)

### Logging
```python
import logging

logger = logging.getLogger('digital_financial')

def get_financial_metrics(filters):
    logger.info(f"Fetching financial metrics with filters: {filters}")

    start_time = time.time()
    try:
        metrics = calculate_metrics(filters)
        duration = time.time() - start_time
        logger.info(f"Metrics calculated in {duration:.2f}s")
        return metrics
    except Exception as e:
        logger.error(f"Error calculating metrics: {e}", exc_info=True)
        raise
```

---

## Migration Plan

1. **Phase 1**: Add new fields to Campaign model
2. **Phase 2**: Implement currency conversion service
3. **Phase 3**: Create aggregation endpoints (one at a time)
4. **Phase 4**: Add caching layer
5. **Phase 5**: Add monitoring and optimize based on real usage

---

## Frontend Integration Points

The frontend uses these hooks:
- `useFinancialMetrics(filters)` → Endpoint #1
- `useMonthlyRevenue(filters)` → Endpoint #2
- `useRevenueByService(filters)` → Endpoint #3
- `useRevenueByClient(filters)` → Endpoint #4
- `useCampaignFinancials(filters, page, pageSize)` → Endpoint #5

All hooks are configured with:
- 5-minute stale time (data is considered fresh for 5 minutes)
- Automatic retry on failure
- Proper loading and error states

---

## Questions?

Contact the frontend team if you need clarification on:
- Expected response formats
- Filter parameter behavior
- Performance requirements
- Authorization logic
