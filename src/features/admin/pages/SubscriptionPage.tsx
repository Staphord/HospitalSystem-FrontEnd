import React from 'react';

interface InvoiceRow {
  number: string;
  period: string;
  amount: string;
  status: 'Paid' | 'Unpaid';
  dueDate: string;
  paidDate: string;
}

export const SubscriptionPage: React.FC = () => {
  const invoices: InvoiceRow[] = [
    {
      number: 'INV-2026-0043',
      period: 'May 2026',
      amount: 'TZS 350,000',
      status: 'Paid',
      dueDate: '01 May 2026',
      paidDate: '02 May 2026',
    },
    {
      number: 'INV-2026-0032',
      period: 'Apr 2026',
      amount: 'TZS 350,000',
      status: 'Paid',
      dueDate: '01 Apr 2026',
      paidDate: '03 Apr 2026',
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto space-y-lg">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <nav className="flex items-center gap-xs text-secondary">
            <span className="font-label-sm text-label-sm">System</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-label-sm text-label-sm text-primary">My Subscription</span>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
        <div className="col-span-1 md:col-span-8 bg-surface-white rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="px-lg py-md border-b border-border-subtle bg-surface-white">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Current Plan</h3>
          </div>
          <div className="p-lg flex-1 bg-surface-white flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-lg">
              <div className="flex items-center gap-md">
                <span className="font-headline-lg text-headline-lg text-primary">Standard</span>
                <span className="bg-[#E3FCEF] text-[#006644] font-label-md text-label-md px-sm py-[2px] rounded-full uppercase font-bold">
                  Active
                </span>
                <span className="bg-surface-container text-on-surface-variant font-label-md text-label-md px-sm py-[2px] rounded-full uppercase font-bold">
                  Monthly
                </span>
              </div>
              <div className="bg-[#FFF0B3] text-[#FF8B00] font-label-sm text-label-sm px-sm py-xs rounded flex items-center gap-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">warning</span>6 days until renewal
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-lg mt-xl">
              <div className="flex flex-col gap-xs">
                <span className="font-label-md text-label-md text-secondary uppercase font-bold">Next Billing</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">15 Jun 2026</span>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="font-label-md text-label-md text-secondary uppercase font-bold">Amount</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">TZS 350,000</span>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="font-label-md text-label-md text-secondary uppercase font-bold">Grace Period</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">7 days</span>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="font-label-md text-label-md text-secondary uppercase font-bold">Auto-Renew</span>
                <div className="flex items-center gap-sm font-body-md text-body-md text-on-surface font-medium">
                  ON
                  <span className="material-symbols-outlined text-[16px] text-secondary">lock</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-4 bg-surface-white rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="px-lg py-md border-b border-border-subtle bg-surface-white">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Plan Usage</h3>
          </div>
          <div className="p-lg space-y-lg bg-surface-white">
            <div className="flex flex-col gap-sm">
              <div className="flex justify-between items-end">
                <span className="font-body-sm text-body-sm text-on-surface font-medium">Staff Accounts</span>
                <div className="text-right">
                  <span className="font-body-sm text-body-sm text-on-surface font-semibold">18/20</span>
                  <span className="font-label-sm text-label-sm text-warning block font-bold">2 remaining</span>
                </div>
              </div>
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-warning rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div className="flex flex-col gap-sm">
              <div className="flex justify-between items-end">
                <span className="font-body-sm text-body-sm text-on-surface font-medium">Storage</span>
                <span className="font-body-sm text-body-sm text-on-surface font-semibold">23GB/50GB</span>
              </div>
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: '46%' }}></div>
              </div>
            </div>
            <div className="flex flex-col gap-sm">
              <div className="flex justify-between items-end">
                <span className="font-body-sm text-body-sm text-on-surface font-medium">Patient Records</span>
                <span className="font-body-sm text-body-sm text-on-surface font-semibold">8,450/100,000</span>
              </div>
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: '8%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-12 bg-surface-white rounded-xl border border-border-subtle overflow-hidden shadow-sm flex flex-col">
          <div className="px-lg py-md border-b border-border-subtle bg-surface-white">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Invoice History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-bright border-b border-border-subtle">
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">
                    Invoice #
                  </th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">
                    Period
                  </th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">
                    Amount
                  </th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">
                    Status
                  </th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">
                    Due Date
                  </th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">
                    Paid Date
                  </th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider text-right">
                    Download
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface bg-surface-white divide-y divide-border-subtle">
                {invoices.map((row, idx) => (
                  <tr key={idx} className="hover:bg-row-hover transition-colors">
                    <td className="py-md px-lg font-semibold text-on-surface">{row.number}</td>
                    <td className="py-md px-lg text-secondary">{row.period}</td>
                    <td className="py-md px-lg text-on-surface">{row.amount}</td>
                    <td className="py-md px-lg">
                      <span className="bg-[#E3FCEF] text-[#006644] font-label-sm text-label-sm px-sm py-[2px] rounded-full uppercase inline-block font-semibold">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-md px-lg text-secondary">{row.dueDate}</td>
                    <td className="py-md px-lg text-secondary">{row.paidDate}</td>
                    <td className="py-md px-lg text-right">
                      <button className="text-primary hover:text-primary-container transition-colors p-xs rounded hover:bg-surface-container-low cursor-pointer bg-transparent border-0">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-1 md:col-span-12 flex flex-wrap gap-md mt-md justify-end">
          <button className="h-10 px-lg rounded bg-transparent border border-border-subtle text-secondary font-label-md text-label-md uppercase hover:bg-surface-container-low transition-colors duration-200 cursor-pointer">
            Request Plan Upgrade
          </button>
          <button className="h-10 px-lg rounded bg-transparent border border-border-subtle text-secondary font-label-md text-label-md uppercase hover:bg-surface-container-low transition-colors duration-200 cursor-pointer">
            Request Plan Downgrade
          </button>
          <button className="h-10 px-lg rounded bg-transparent border border-error text-error font-label-md text-label-md uppercase hover:bg-error-container hover:text-on-error-container transition-colors duration-200 ml-auto md:ml-0 cursor-pointer">
            Request Cancellation
          </button>
        </div>
      </div>
    </div>
  );
};
