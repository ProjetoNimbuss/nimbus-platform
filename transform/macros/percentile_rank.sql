{% macro percentile_rank(column, partition_by) %}
  PERCENT_RANK() OVER (
    PARTITION BY {{ partition_by }}
    ORDER BY {{ column }}
  )
{% endmacro %}
