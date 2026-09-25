# Database Architecture & Schema

## Tables & Relationships

1. **users**: `id`, `email`, `hashed_password`, `first_name`, `last_name`, `role`, `is_active`, `is_verified`, `created_at`, `updated_at`.
2. **businesses**: `id`, `name`, `business_type`, `owner_id` (FK to users), `email`, `phone`, `address`, `city`, `tax_id_gst`, `currency`, `timezone`.
3. **business_users**: `id`, `business_id` (FK), `user_id` (FK), `department`.
4. **categories**: `id`, `business_id` (FK), `name`, `description`.
5. **products**: `id`, `business_id` (FK), `category_id` (FK), `supplier_id` (FK), `name`, `sku`, `brand`, `cost_price`, `selling_price`, `tax_rate`, `current_stock`, `min_stock_alert`, `max_stock_capacity`, `unit`, `status`.
6. **inventory_movements**: `id`, `business_id` (FK), `product_id` (FK), `movement_type` (`PURCHASE`, `SALE`, `RETURN`, `DAMAGE`, `ADJUSTMENT`, `TRANSFER`), `quantity_change`, `previous_stock`, `new_stock`, `reference_id`, `created_by_user_id` (FK), `created_at`.
7. **customers**: `id`, `business_id` (FK), `name`, `email`, `phone`, `total_spent`, `order_count`, `last_purchase_date`, `rfm_segment`, `churn_risk`, `churn_risk_score`.
8. **suppliers**: `id`, `business_id` (FK), `name`, `contact_person`, `email`, `phone`, `total_purchases_amount`, `outstanding_balance`.
9. **sales**: `id`, `business_id` (FK), `customer_id` (FK), `invoice_number`, `sale_date`, `subtotal`, `discount_amount`, `tax_amount`, `grand_total`, `paid_amount`, `payment_method`, `payment_status`.
10. **sale_items**: `id`, `sale_id` (FK), `product_id` (FK), `product_name`, `quantity`, `unit_price`, `unit_cost`, `discount_rate`, `tax_rate`, `total_price`.
11. **purchases**: `id`, `business_id` (FK), `supplier_id` (FK), `purchase_number`, `purchase_date`, `subtotal`, `tax_amount`, `grand_total`, `payment_status`.
12. **purchase_items**: `id`, `purchase_id` (FK), `product_id` (FK), `product_name`, `quantity`, `unit_cost`, `tax_rate`, `total_cost`.
13. **expenses**: `id`, `business_id` (FK), `category`, `description`, `amount`, `payment_method`, `expense_date`.
14. **notifications**: `id`, `business_id` (FK), `user_id` (FK), `type`, `title`, `message`, `is_read`, `created_at`.
15. **audit_logs**: `id`, `business_id` (FK), `user_id` (FK), `action`, `resource_type`, `resource_id`, `details`, `created_at`.
16. **ml_models**: `id`, `business_id` (FK), `model_type`, `version`, `metrics_json`, `status`, `last_trained_at`.
