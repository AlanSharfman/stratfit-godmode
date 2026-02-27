import React, { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import InitializeForm, { InitializeFormValues } from "./InitializeForm"
import { useBaselineStore } from "@/state/baselineStore"

export default function InitializeBaselinePage() {
  const navigate = useNavigate()
  const setBaseline = useBaselineStore((s) => s.setBaseline)
  const onSubmit = useCallback(
    (values: InitializeFormValues) => {
      setBaseline({
        cash: values.cash,
        monthlyBurn: values.monthlyBurn,
        revenue: values.revenue,
        grossMargin: values.grossMargin,
        growthRate: values.growthRate,
        churnRate: values.churnRate,
        headcount: values.headcount,
        arpa: values.arpa,
      })
      navigate("/decision")
    },
    [navigate, setBaseline]
  )
  return <InitializeForm onSubmit={onSubmit} />
}
