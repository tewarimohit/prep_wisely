-- AddUniqueConstraint
ALTER TABLE "Plan" ADD CONSTRAINT "plan_user_date_unique" UNIQUE ("userId", "date");
