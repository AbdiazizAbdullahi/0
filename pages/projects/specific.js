import { Card } from '@/components/ui/card'
import React from 'react'
import MetricCard from '@/components/projectsComp/projectMetric'
import BankAccounts from '@/components/projectsComp/accountMetric'
import useProjectStore from '@/stores/projectStore'

export default function SpecificProject() {
  const project = useProjectStore(state => state.project)
  console.log(project._id)

  return (
    <div className="space-y-4">
      <div>
        <BankAccounts />
      </div>
      <div className="flex space-x-4">
        <MetricCard link='/invoices' title='Invoices' subtitle='The total amount of invoices' amount={185645200} />
        <MetricCard link='/transactions' title='Transactions' subtitle='The total amount transacted' amount={240186300} />
        <MetricCard />
      </div>
    </div>
  )
}
