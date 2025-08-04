There is a gold crown in the header of the web app that helps with the days remaining for subscription currently i noticed that it is not decreasing so i want to know how we can be able to fix this to make sure that once a user date expires they fall back to free plan and once as the day is going the Gold crown accurately calculating the days remaining please

| id                                   | email                    | full_name              | subscription_plan | subscription_status | trial_ends_at | subscription_start_date       | subscription_end_date         |

| ------------------------------------ | ------------------------ | ---------------------- | ----------------- | ------------------- | ------------- | ----------------------------- | ----------------------------- |

| c9e4e667-94d5-41d3-bf36-41fa09336efe | sabiops.vercel@gmail.com | CALEB KELECHI ONYEMECH | monthly           | active              | null          | 2025-08-01 04:46:04.701815+00 | 2025-09-01 08:52:07.285066+00 |

Check the current implementation and please come up with a plan on how we can fix this and enforce limits

| plan_name      | feature_type | period_type | limit_count |

| -------------- | ------------ | ----------- | ----------- |

| free           | expenses     | monthly     | 20          |

| free           | invoices     | monthly     | 5           |

| free           | products     | monthly     | 20          |

| free           | sales        | monthly     | 50          |

| monthly        | expenses     | monthly     | 500         |

| monthly        | invoices     | monthly     | 450         |

| monthly        | products     | monthly     | 500         |

| monthly        | sales        | monthly     | 1500        |

| silver_monthly | expenses     | monthly     | 500         |

| silver_monthly | invoices     | monthly     | 450         |

| silver_monthly | products     | monthly     | 500         |

| silver_monthly | sales        | monthly     | 1500        |

| silver_weekly  | expenses     | weekly      | 100         |

| silver_weekly  | invoices     | weekly      | 100         |

| silver_weekly  | products     | weekly      | 100         |

| silver_weekly  | sales        | weekly      | 250         |

| silver_yearly  | expenses     | yearly      | 2000        |

| silver_yearly  | invoices     | yearly      | 6000        |

| silver_yearly  | products     | yearly      | 2000        |

| silver_yearly  | sales        | yearly      | 18000       |

| weekly         | expenses     | weekly      | 100         |

| weekly         | invoices     | weekly      | 100         |

| weekly         | products     | weekly      | 100         |

| weekly         | sales        | weekly      | 250         |

| yearly         | expenses     | yearly      | 2000        |

| yearly         | invoices     | yearly      | 6000        |

| yearly         | products     | yearly      | 2000        |

| yearly         | sales        | yearly      | 18000       |

You can see that these are similar check how the backend uses this whether it uses silver_* so i can drop the others and also how we can decrease the days please using the existing implementation or enhancing it because there are already files tracking usage limits but am not sure they are decreasing days and that they are enforced once any of this limits are hit