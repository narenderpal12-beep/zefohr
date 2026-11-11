import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, Check, Download, ExternalLink, FileText, Printer, Search, ShieldCheck } from 'lucide-react';
import { useCreateLead } from '@workspace/api-client-react';
import { arr, errMsg, formatINR, iconFor, str, useContent, useSection, type AnyObj } from '@/lib/content';
import { Container, FaqList, PageHero, Reveal, SectionHead } from '@/components/site/primitives';
import { CtaBand, inputCls } from '@/components/site/sections';

type Values = Record<string, string>;
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
};
const money = (value: number) => formatINR(Math.round(Number.isFinite(value) ? value : 0));
const safeSlug = (value: unknown) => str(value).toLowerCase().replace(/[^a-z0-9-]/g, '');
const htmlEscape = (value: unknown) => str(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
const verifiedReference = (item: AnyObj) => item.status === 'published' && item.verified === true && /^https:\/\/[^\s]+$/i.test(str(item.sourceUrl)) && Boolean(str(item.lastUpdated).trim());

function ToolField({ label, name, value, onChange, type = 'number', min, step = 'any', placeholder }: {
  label: string; name: string; value: string; onChange: (name: string, value: string) => void;
  type?: string; min?: string; step?: string; placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <input className={`${inputCls} mt-2`} type={type} name={name} value={value} min={min} step={step} placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)} />
    </label>
  );
}

function TextField({ label, name, value, onChange, multiline = false, type = 'text', placeholder }: {
  label: string; name: string; value: string; onChange: (name: string, value: string) => void;
  multiline?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      {multiline
        ? <textarea className={`${inputCls} mt-2 min-h-28 resize-y`} name={name} value={value} placeholder={placeholder} onChange={(event) => onChange(name, event.target.value)} />
        : <input className={`${inputCls} mt-2`} type={type} name={name} value={value} placeholder={placeholder} onChange={(event) => onChange(name, event.target.value)} />}
    </label>
  );
}

function ResultLine({ label, value }: { label: string; value: ReactNode }) {
  return <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] py-3 last:border-0"><span className="text-sm text-muted-foreground">{label}</span><strong className="text-right text-sm font-semibold text-foreground">{value}</strong></div>;
}

function DownloadActions({ html, filename }: { html: string; filename: string }) {
  const download = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeSlug(filename) || 'peoplehub-document'}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const print = () => {
    const popup = window.open('', '_blank');
    if (!popup) return;
    popup.opener = null;
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    window.setTimeout(() => popup.print(), 250);
  };
  const downloadPdf = () => {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, 'text/html');
    const plain = (parsed.body.innerText || parsed.body.textContent || '').replace(/₹/g, 'INR').replace(/[^\x20-\x7E\n]/g, '?');
    const wrapped = plain.split(/\r?\n/).flatMap((line) => {
      const words = line.split(/\s+/);
      const lines: string[] = [];
      let current = '';
      for (const word of words) {
        if ((current ? `${current} ${word}` : word).length > 88 && current) { lines.push(current); current = word; }
        else current = current ? `${current} ${word}` : word;
      }
      lines.push(current);
      return lines;
    });
    const esc = (text: string) => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const stream = `BT\n/F1 12 Tf\n54 750 Td\n${wrapped.slice(0, 39).map((line, index) => `${index ? '0 -18 Td\n' : ''}(${esc(line)}) Tj`).join('\n')}\nET`;
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`,
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const [index, object] of objects.entries()) {
      offsets.push(new TextEncoder().encode(pdf).length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    }
    const xref = new TextEncoder().encode(pdf).length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeSlug(filename) || 'peoplehub-document'}.pdf`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={downloadPdf} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand"><Download className="h-4 w-4" />Download PDF</button><button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold"><FileText className="h-4 w-4" />Download HTML</button><button type="button" onClick={print} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold"><Printer className="h-4 w-4" />Print</button></div>;
}

function printableDocument(title: string, content: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${htmlEscape(title)}</title><style>body{font:16px/1.6 Arial,sans-serif;max-width:760px;margin:48px auto;padding:0 24px;color:#18212f}h1{font-size:26px;border-bottom:2px solid #e5e9ef;padding-bottom:12px}pre{white-space:pre-wrap;font:inherit}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:10px;border-bottom:1px solid #dce2eb}@media print{body{margin:0 auto}}</style></head><body><h1>${htmlEscape(title)}</h1>${content}</body></html>`;
}

function ToolResults({ children }: { children: ReactNode }) {
  return <div aria-live="polite" className="mt-6 rounded-2xl border border-[color:var(--ph-cyan)]/20 bg-[color:var(--ph-cyan)]/[0.06] p-5">{children}</div>;
}

function EstimateNotice({ text }: { text: string }) {
  return <p className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-3 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 text-amber-200" />{text}</p>;
}

function RoiTool({ section }: { section: AnyObj }) {
  const assumptions = (section.roiAssumptions ?? {}) as AnyObj;
  const [values, setValues] = useState<Values>({ employees: '100', hrTeamSize: '3', avgSalary: '35000', payrollHours: '60', tools: '3' });
  const set = (name: string, value: string) => setValues((old) => ({ ...old, [name]: value }));
  const staff = number(values.employees);
  const hrTeam = number(values.hrTeamSize);
  const avgMonthlySalary = number(values.avgSalary);
  const monthlyPayrollHours = number(values.payrollHours);
  const estimatedHours = Math.min(staff * number(assumptions.hoursSavedPerEmployeeMonth) * 12, monthlyPayrollHours * 12);
  const hourlyCost = avgMonthlySalary * 12 / (26 * 8) * number(assumptions.loadedCostMultiplier, 1);
  const annualValue = estimatedHours * hourlyCost;
  const implementation = number(assumptions.implementationCost);
  const payback = annualValue > 0 && implementation > 0 ? implementation / (annualValue / 12) : null;
  return <>
    <div className="grid gap-4 sm:grid-cols-2">
      <ToolField label="Employees" name="employees" value={values.employees} onChange={set} min="1" />
      <ToolField label="HR team size" name="hrTeamSize" value={values.hrTeamSize} onChange={set} min="1" />
      <ToolField label="Average monthly salary (₹)" name="avgSalary" value={values.avgSalary} onChange={set} min="0" />
      <ToolField label="Payroll administration hours per month" name="payrollHours" value={values.payrollHours} onChange={set} min="0" />
      <ToolField label="Tools currently used (count)" name="tools" value={values.tools} onChange={set} min="0" />
    </div>
    <ToolResults>
      <ResultLine label="Potential hours returned per year" value={`${Math.round(estimatedHours).toLocaleString('en-IN')} hours`} />
      <ResultLine label="Estimated annual time value" value={money(annualValue)} />
      <ResultLine label="Simple payback estimate" value={implementation > 0 && payback !== null ? `${payback.toFixed(1)} months` : 'Add a setup cost in Admin to estimate'} />
      <p className="mt-3 text-xs text-muted-foreground">Based on {hrTeam.toLocaleString('en-IN')} HR team members and {number(values.tools)} current tools. {str(assumptions.note)}</p>
    </ToolResults>
  </>;
}

function PricingTool({ section }: { section: AnyObj }) {
  const [employees, setEmployees] = useState(100);
  const [selected, setSelected] = useState<string[]>([]);
  const assumptions = (section.pricingAssumptions ?? {}) as AnyObj;
  const rate = number(assumptions.baseMonthlyPerEmployee);
  const moduleRate = number(assumptions.selectedModuleMonthly);
  const monthly = employees * (rate + moduleRate * selected.length);
  const range = number(assumptions.rangePercent, 10) / 100;
  return <>
    <label className="block text-sm font-medium">Employees: <strong>{employees.toLocaleString('en-IN')}</strong><input className="mt-4 w-full accent-[color:var(--ph-cyan)]" type="range" min="1" max="5000" step="1" value={employees} onChange={(event) => setEmployees(Number(event.target.value))} /></label>
    <fieldset className="mt-6"><legend className="text-sm font-semibold">Modules to include</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{arr<string>(section.pricingModules).map((module) => <label key={module} className="flex items-center gap-2 rounded-xl border border-white/10 p-3 text-sm"><input type="checkbox" checked={selected.includes(module)} onChange={(event) => setSelected(event.target.checked ? [...selected, module] : selected.filter((item) => item !== module))} />{module}</label>)}</div></fieldset>
    <ToolResults>
      {rate > 0 ? <><ResultLine label="Indicative monthly range" value={`${money(monthly * (1 - range))} – ${money(monthly * (1 + range))}`} /><ResultLine label="Selected modules" value={selected.length} /><p className="mt-3 text-xs text-muted-foreground">{str(assumptions.note)}</p></> : <p className="text-sm leading-relaxed text-muted-foreground">{str(assumptions.note)} <Link className="text-foreground underline" href="/request-demo">Ask the team for a quote</Link></p>}
    </ToolResults>
  </>;
}

function SalaryTool({ section }: { section: AnyObj }) {
  const a = (section.salaryAssumptions ?? {}) as AnyObj;
  const [ctc, setCtc] = useState('600000');
  const annual = number(ctc);
  const basic = annual * number(a.basicPercent, 50) / 100;
  const hra = basic * number(a.hraPercentOfBasic, 40) / 100;
  const pf = basic * number(a.employerPfPercent, 12) / 100;
  const special = Math.max(0, annual - basic - hra - pf);
  return <>
    <ToolField label="Annual CTC (₹)" name="ctc" value={ctc} onChange={(_, value) => setCtc(value)} min="0" />
    <ToolResults><ResultLine label="Basic pay / year" value={money(basic)} /><ResultLine label="HRA / year" value={money(hra)} /><ResultLine label="Employer PF assumption / year" value={money(pf)} /><ResultLine label="Remaining CTC allowance / year" value={money(special)} /><ResultLine label="Estimated monthly gross" value={money(annual / 12)} /><p className="mt-3 text-xs text-muted-foreground">{str(a.note)}</p></ToolResults>
  </>;
}

function GratuityTool({ section }: { section: AnyObj }) {
  const a = (section.gratuityAssumptions ?? {}) as AnyObj;
  const [values, setValues] = useState<Values>({ basic: '30000', years: '5' });
  const set = (name: string, value: string) => setValues((old) => ({ ...old, [name]: value }));
  const eligible = number(values.years) >= number(a.eligibilityYears, 5);
  const amount = eligible ? number(values.basic) * number(a.monthsPerYear, 15) / number(a.divisor, 26) * number(values.years) : 0;
  return <>
    <div className="grid gap-4 sm:grid-cols-2"><ToolField label="Last-drawn monthly basic pay (₹)" name="basic" value={values.basic} onChange={set} min="0" /><ToolField label="Completed years of service" name="years" value={values.years} onChange={set} min="0" /></div>
    <ToolResults><ResultLine label="Eligibility check" value={eligible ? 'Meets the configured service threshold' : `Below configured ${number(a.eligibilityYears, 5)}-year threshold`} /><ResultLine label="Estimated gratuity" value={money(amount)} /><p className="mt-3 text-xs text-muted-foreground">Formula configured as last-drawn basic × {number(a.monthsPerYear, 15)} ÷ {number(a.divisor, 26)} × completed service years. Confirm eligibility and applicable rules with a qualified professional.</p></ToolResults>
  </>;
}

function HraTool({ section }: { section: AnyObj }) {
  const assumptions = (section.hraAssumptions ?? {}) as AnyObj;
  const [values, setValues] = useState<Values>({ basic: '30000', hra: '12000', rent: '15000', metro: 'true' });
  const set = (name: string, value: string) => setValues((old) => ({ ...old, [name]: value }));
  const basic = number(values.basic);
  const actualHra = number(values.hra);
  const rent = number(values.rent);
  const salaryLimit = basic * number(values.metro === 'true' ? assumptions.metroPercent : assumptions.nonMetroPercent, values.metro === 'true' ? 50 : 40) / 100;
  const exemption = Math.max(0, Math.min(actualHra, rent - basic * number(assumptions.rentLessBasicPercent, 10) / 100, salaryLimit));
  return <>
    <div className="grid gap-4 sm:grid-cols-2"><ToolField label="Monthly basic salary (₹)" name="basic" value={values.basic} onChange={set} min="0" /><ToolField label="Monthly HRA received (₹)" name="hra" value={values.hra} onChange={set} min="0" /><ToolField label="Monthly rent paid (₹)" name="rent" value={values.rent} onChange={set} min="0" /><label className="block text-sm font-medium">Residence category<select className={`${inputCls} mt-2`} value={values.metro} onChange={(event) => set('metro', event.target.value)}><option value="true">Metro assumption</option><option value="false">Non-metro assumption</option></select></label></div>
    <ToolResults><ResultLine label="Estimated HRA exemption / month" value={money(exemption)} /><ResultLine label="HRA remaining after estimated exemption" value={money(Math.max(0, actualHra - exemption))} /><p className="mt-3 text-xs text-muted-foreground">Simplified estimate using the minimum of actual HRA, rent less 10% of basic, and a 40%/50% salary limit. Confirm eligible salary components and current rules.</p></ToolResults>
  </>;
}

function TaxTool({ section }: { section: AnyObj }) {
  const [income, setIncome] = useState('1200000');
  const settings = (section.taxAssumptions ?? {}) as AnyObj;
  const taxFor = (raw: unknown[]) => {
    const slabs = arr<AnyObj>(raw).filter((slab) => Number.isFinite(Number(slab.rate)) && (slab.upTo == null || Number.isFinite(Number(slab.upTo)))).sort((a, b) => (a.upTo == null ? Infinity : number(a.upTo)) - (b.upTo == null ? Infinity : number(b.upTo)));
    if (!slabs.length || !slabs.some((slab) => slab.upTo == null)) return null;
    let lower = 0, total = 0, taxable = number(income);
    for (const slab of slabs) {
      const upper = slab.upTo == null ? taxable : Math.min(taxable, number(slab.upTo));
      if (upper > lower) total += (upper - lower) * number(slab.rate) / 100;
      if (slab.upTo == null || taxable <= number(slab.upTo)) break;
      lower = number(slab.upTo);
    }
    return total * (1 + number(settings.cessPercent) / 100);
  };
  const oldTax = taxFor(arr<AnyObj>(settings.oldRegime));
  const newTax = taxFor(arr<AnyObj>(settings.newRegime));
  return <>
    <ToolField label="Estimated annual taxable income (₹)" name="income" value={income} onChange={(_, value) => setIncome(value)} min="0" />
    <ToolResults><ResultLine label="Configured old-regime estimate" value={oldTax === null ? 'Configure tax slabs in Admin' : money(oldTax)} /><ResultLine label="Configured new-regime estimate" value={newTax === null ? 'Configure tax slabs in Admin' : money(newTax)} />{oldTax !== null && newTax !== null ? <ResultLine label="Lower configured estimate" value={oldTax <= newTax ? 'Old regime' : 'New regime'} /> : null}<p className="mt-3 text-xs text-muted-foreground">{str(settings.basis)} Tax slab data is editable in Admin → Content → Free HR tools.</p></ToolResults>
  </>;
}

function LeaveTool({ section }: { section: AnyObj }) {
  const divisor = number((section.leaveAssumptions as AnyObj | undefined)?.monthlyDivisor, 26);
  const [values, setValues] = useState<Values>({ salary: '30000', days: '10', divisor: String(divisor) });
  const set = (name: string, value: string) => setValues((old) => ({ ...old, [name]: value }));
  const amount = number(values.salary) / Math.max(number(values.divisor, 26), 1) * number(values.days);
  return <>
    <div className="grid gap-4 sm:grid-cols-3"><ToolField label="Monthly salary basis (₹)" name="salary" value={values.salary} onChange={set} min="0" /><ToolField label="Encashable leave days" name="days" value={values.days} onChange={set} min="0" /><ToolField label="Monthly divisor (editable)" name="divisor" value={values.divisor} onChange={set} min="1" /></div>
    <ToolResults><ResultLine label="Estimated leave encashment" value={money(amount)} /><p className="mt-3 text-xs text-muted-foreground">Uses salary ÷ divisor × eligible days. The applicable salary basis and leave policy vary by employer and location.</p></ToolResults>
  </>;
}

function NoticeTool({ section }: { section: AnyObj }) {
  const divisor = number((section.noticeAssumptions as AnyObj | undefined)?.monthlyDivisor, 26);
  const [values, setValues] = useState<Values>({ salary: '50000', notice: '30', served: '20', leave: '5', earnings: '0', deductions: '0', divisor: String(divisor) });
  const set = (name: string, value: string) => setValues((old) => ({ ...old, [name]: value }));
  const daily = number(values.salary) / Math.max(1, number(values.divisor, 26));
  const shortfall = Math.max(0, number(values.notice) - number(values.served));
  const noticeAmount = shortfall * daily;
  const leaveAmount = number(values.leave) * daily;
  const net = noticeAmount + leaveAmount + number(values.earnings) - number(values.deductions);
  return <>
    <div className="grid gap-4 sm:grid-cols-2">{[['Monthly salary basis (₹)', 'salary'], ['Notice days required', 'notice'], ['Notice days served', 'served'], ['Eligible leave days', 'leave'], ['Other estimated earnings (₹)', 'earnings'], ['Estimated deductions (₹)', 'deductions'], ['Monthly divisor', 'divisor']].map(([label, name]) => <ToolField key={name} label={label} name={name} value={values[name]} onChange={set} min="0" />)}</div>
    <ToolResults><ResultLine label="Notice shortfall estimate" value={money(noticeAmount)} /><ResultLine label="Leave encashment estimate" value={money(leaveAmount)} /><ResultLine label="Indicative settlement total" value={money(net)} /><p className="mt-3 text-xs text-muted-foreground">This planning worksheet does not calculate statutory dues, tax, deductions, policy exceptions or final payroll. Review all components with your employer and payroll adviser.</p></ToolResults>
  </>;
}

function PayslipTool() {
  const [values, setValues] = useState<Values>({ company: '', employee: '', employeeId: '', period: '', basic: '30000', hra: '12000', allowance: '3000', deductions: '2500' });
  const set = (name: string, value: string) => setValues((old) => ({ ...old, [name]: value }));
  const earnings = number(values.basic) + number(values.hra) + number(values.allowance);
  const net = earnings - number(values.deductions);
  const rows = [['Basic', values.basic], ['HRA', values.hra], ['Other allowance', values.allowance], ['Deductions', `− ${values.deductions}`]];
  const html = printableDocument('Payslip', `<p><strong>${htmlEscape(values.company)}</strong></p><p>Employee: ${htmlEscape(values.employee)} · ID: ${htmlEscape(values.employeeId)}</p><p>Pay period: ${htmlEscape(values.period)}</p><table><tbody>${rows.map(([label, amount]) => `<tr><td>${htmlEscape(label)}</td><td>${htmlEscape(money(number(amount)))}</td></tr>`).join('')}<tr><th>Net pay</th><th>${htmlEscape(money(net))}</th></tr></tbody></table><p><em>Illustrative payslip preview. Review all figures before use.</em></p>`);
  return <>
    <div className="grid gap-4 sm:grid-cols-2">{[['Company name', 'company', 'text'], ['Employee name', 'employee', 'text'], ['Employee ID', 'employeeId', 'text'], ['Pay period', 'period', 'month'], ['Basic earnings (₹)', 'basic', 'number'], ['HRA (₹)', 'hra', 'number'], ['Other earnings (₹)', 'allowance', 'number'], ['Deductions (₹)', 'deductions', 'number']].map(([label, name, type]) => type === 'number' ? <ToolField key={name} label={label} name={name} value={values[name]} onChange={set} min="0" /> : <TextField key={name} label={label} name={name} value={values[name]} onChange={set} type={type} />)}</div>
    <ToolResults><h3 className="font-semibold">Payslip preview</h3><p className="mt-1 text-sm text-muted-foreground">{values.company || 'Company'} · {values.employee || 'Employee'} · {values.period || 'Pay period'}</p><ResultLine label="Total earnings" value={money(earnings)} /><ResultLine label="Total deductions" value={money(number(values.deductions))} /><ResultLine label="Net pay" value={money(net)} /><DownloadActions html={html} filename="payslip" /><p className="mt-3 text-xs text-muted-foreground">Download the printable HTML or use Print / save as PDF. This is a document draft, not a payroll record.</p></ToolResults>
  </>;
}

function LettersTool({ section }: { section: AnyObj }) {
  const templates = arr<AnyObj>(section.letterTemplates);
  const [key, setKey] = useState(str(templates[0]?.key, 'offer'));
  const [values, setValues] = useState<Values>({ employee_name: '', company_name: '', job_title: '', start_date: '', end_date: '', compensation: '', signatory_name: '' });
  const set = (name: string, value: string) => setValues((old) => ({ ...old, [name]: value }));
  const template = templates.find((item) => str(item.key) === key) ?? templates[0];
  const body = str(template?.body).replace(/\{\{([a-z_]+)\}\}/g, (_, token: string) => values[token] || `[${token.replace(/_/g, ' ')}]`);
  const html = printableDocument(str(template?.title, 'HR letter'), `<pre>${htmlEscape(body)}</pre>`);
  return <>
    <label className="block text-sm font-medium">Letter type<select className={`${inputCls} mt-2`} value={key} onChange={(event) => setKey(event.target.value)}>{templates.map((item) => <option key={str(item.key)} value={str(item.key)}>{str(item.title)}</option>)}</select></label>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">{[['Employee name', 'employee_name'], ['Company name', 'company_name'], ['Job title', 'job_title'], ['Start date', 'start_date'], ['End date (if applicable)', 'end_date'], ['Annual compensation (if applicable)', 'compensation'], ['Signatory name', 'signatory_name']].map(([label, name]) => <TextField key={name} label={label} name={name} value={values[name]} onChange={set} />)}</div>
    <ToolResults><h3 className="font-semibold">Editable draft preview</h3><pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{body}</pre><DownloadActions html={html} filename={str(template?.key, 'hr-letter')} /><p className="mt-3 text-xs text-muted-foreground">Review the draft against your organisation’s approved terms and applicable law before issuing.</p></ToolResults>
  </>;
}

function JobDescriptionTool() {
  const [values, setValues] = useState<Values>({ role: '', level: '', skills: '', responsibilities: '', location: '', company: '' });
  const set = (name: string, value: string) => setValues((old) => ({ ...old, [name]: value }));
  const body = `${values.role || '[Role title]'}${values.level ? ` · ${values.level}` : ''}\n${values.company ? `${values.company}${values.location ? ` · ${values.location}` : ''}` : values.location}\n\nRole overview\nWe are looking for a ${values.level || 'qualified'} ${values.role || '[role title]'} to contribute to the team’s goals. The successful candidate will work with relevant stakeholders and follow the organisation’s approved processes.\n\nKey responsibilities\n${(values.responsibilities || 'Add role-specific responsibilities.').split('\n').filter(Boolean).map((item) => `• ${item}`).join('\n')}\n\nSkills and experience\n${(values.skills || 'Add essential skills and experience.').split(',').map((item) => `• ${item.trim()}`).join('\n')}\n\nEqual opportunity\nWe welcome applications from candidates with relevant skills and experience. Adjust this draft to reflect your organisation’s policies and local requirements.`;
  const html = printableDocument('Job description draft', `<pre>${htmlEscape(body)}</pre>`);
  return <>
    <div className="grid gap-4 sm:grid-cols-2"><TextField label="Role title" name="role" value={values.role} onChange={set} /><TextField label="Level" name="level" value={values.level} onChange={set} placeholder="e.g. Associate, Senior" /><TextField label="Company" name="company" value={values.company} onChange={set} /><TextField label="Location" name="location" value={values.location} onChange={set} /><TextField label="Skills (comma-separated)" name="skills" value={values.skills} onChange={set} /><TextField label="Responsibilities (one per line)" name="responsibilities" value={values.responsibilities} onChange={set} multiline /></div>
    <ToolResults><h3 className="font-semibold">Role description preview</h3><pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{body}</pre><DownloadActions html={html} filename="job-description" /></ToolResults>
  </>;
}

function MaturityTool({ section }: { section: AnyObj }) {
  const questions = arr<AnyObj>(section.maturityQuestions);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const answered = questions.length > 0 && questions.every((_, index) => answers[index] !== undefined);
  const score = Object.values(answers).reduce((sum, value) => sum + value, 0);
  const percent = questions.length ? Math.round(score / (questions.length * 2) * 100) : 0;
  return <><div className="space-y-4">{questions.map((item, index) => <fieldset key={index} className="rounded-2xl border border-white/10 p-4"><legend className="px-1 text-sm font-semibold">{index + 1}. {str(item.question)}</legend><div className="mt-2 grid gap-2">{arr<string>(item.options).map((option, value) => <label key={option} className="flex items-center gap-2 text-sm text-muted-foreground"><input type="radio" name={`maturity-${index}`} checked={answers[index] === value} onChange={() => setAnswers((old) => ({ ...old, [index]: value }))} />{option}</label>)}</div></fieldset>)}</div>
    {answered ? <ToolResults><div className="font-display text-4xl font-bold">{percent}%</div><p className="mt-2 text-sm text-muted-foreground">{percent < 35 ? 'Start by documenting owners and repeatable steps for a few priority workflows.' : percent < 70 ? 'Strengthen consistency by connecting existing checklists, review points and reporting.' : 'Review the controls and measures periodically, and identify where teams still need clearer handoffs.'}</p><div className="mt-4 space-y-1">{questions.map((item, index) => answers[index] < 2 ? <p key={index} className="text-sm"><span className="font-medium">{str(item.category)}:</span> <span className="text-muted-foreground">consider defining an owner and a repeatable review step.</span></p> : null)}</div></ToolResults> : <p className="mt-4 text-sm text-muted-foreground">Answer every question to see a planning score and suggested next steps.</p>}
  </>;
}

function ModuleFinderTool({ section }: { section: AnyObj }) {
  const questions = arr<AnyObj>(section.moduleQuestions);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const complete = questions.length > 0 && Object.keys(answers).length === questions.length;
  const recommendations = Array.from(new Set(questions.filter((_, index) => answers[index]).flatMap((item) => arr<string>(item.modules))));
  const current = questions[step];
  if (!questions.length) return <p className="text-sm text-muted-foreground">Add module-finder questions in Admin to use this tool.</p>;
  return <div className="rounded-2xl border border-white/10 p-5"><p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Step {Math.min(step + 1, questions.length)} of {questions.length}</p>{complete ? <><h3 className="mt-3 text-lg font-semibold">Areas worth exploring</h3>{recommendations.length ? <ul className="mt-3 space-y-2">{recommendations.map((module) => <li key={module} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-[color:var(--ph-cyan)]" />{module}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Your answers suggest starting with a conversation about your current process.</p>}<p className="mt-4 text-xs text-muted-foreground">These are discussion prompts, not a product recommendation or commitment.</p><button type="button" className="mt-4 text-sm underline" onClick={() => { setStep(0); setAnswers({}); }}>Start again</button></> : <><h3 className="mt-3 text-lg font-semibold">{str(current?.question)}</h3><div className="mt-5 flex gap-3"><button type="button" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand" onClick={() => { setAnswers((old) => ({ ...old, [step]: true })); setStep((value) => Math.min(value + 1, questions.length - 1)); }}>Yes</button><button type="button" className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold" onClick={() => { setAnswers((old) => ({ ...old, [step]: false })); setStep((value) => Math.min(value + 1, questions.length - 1)); }}>Not now</button></div></>}</div>;
}

function ReferenceTool({ kind, section }: { kind: 'holiday' | 'wage'; section: AnyObj }) {
  const holiday = kind === 'holiday';
  const items = arr<AnyObj>(holiday ? section.holidayReferences : section.minimumWageReferences).filter(verifiedReference);
  const [query, setQuery] = useState('');
  const filtered = items.filter((item) => `${str(item.title)} ${str(item.location)} ${str(item.year)} ${str(item.category)} ${str(item.summary)}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <label className="relative block max-w-lg text-sm font-medium">{holiday ? 'Search a state, year or holiday' : 'Search a state, category or wage group'}<Search className="pointer-events-none absolute left-3 top-10 h-4 w-4 text-muted-foreground" /><input className={`${inputCls} mt-2 pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    {filtered.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{filtered.map((item, index) => <article key={`${str(item.title)}-${index}`} className="rounded-2xl border border-white/10 p-5"><p className="text-xs font-mono uppercase tracking-wider text-[color:var(--ph-cyan)]">{[str(item.location), str(item.year), str(item.category)].filter(Boolean).join(' · ')}</p><h3 className="mt-3 font-semibold">{str(item.title, holiday ? 'Holiday reference' : 'Minimum-wage reference')}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{str(item.summary || item.details)}</p>{Array.isArray(item.dates) ? <ul className="mt-3 space-y-1 text-sm">{item.dates.map((date: AnyObj, i: number) => <li key={i}>{str(date.date)} — {str(date.name)}</li>)}</ul> : null}<p className="mt-4 text-xs text-muted-foreground">Source updated: {str(item.lastUpdated)}</p><a href={str(item.sourceUrl)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-foreground underline">{str(item.sourceTitle, 'Open verified source')} <ExternalLink className="h-3.5 w-3.5" /></a></article>)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-white/15 p-6 text-sm leading-relaxed text-muted-foreground">{holiday ? 'No verified holiday reference is available yet. An administrator must publish reviewed data with a secure source link and update date before it appears here.' : 'No verified minimum-wage reference is available yet. An administrator must publish reviewed data with a secure source link and update date before it appears here.'}</p>}
  </>;
}

function ToolBody({ tool, section }: { tool: AnyObj; section: AnyObj }) {
  switch (str(tool.slug)) {
    case 'roi-calculator': return <RoiTool section={section} />;
    case 'pricing-estimator': return <PricingTool section={section} />;
    case 'salary-ctc': return <SalaryTool section={section} />;
    case 'gratuity': return <GratuityTool section={section} />;
    case 'hra': return <HraTool section={section} />;
    case 'tax-regime': return <TaxTool section={section} />;
    case 'leave-encashment': return <LeaveTool section={section} />;
    case 'notice-settlement': return <NoticeTool section={section} />;
    case 'payslip': return <PayslipTool />;
    case 'hr-letters': return <LettersTool section={section} />;
    case 'job-description': return <JobDescriptionTool />;
    case 'maturity-assessment': return <MaturityTool section={section} />;
    case 'module-finder': return <ModuleFinderTool section={section} />;
    case 'public-holidays': return <ReferenceTool kind="holiday" section={section} />;
    case 'minimum-wage': return <ReferenceTool kind="wage" section={section} />;
    default: return null;
  }
}

function ToolLeadCapture({ section, slug }: { section: AnyObj; slug: string }) {
  const lead = useCreateLead();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter your name and a valid email address.');
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const tracking = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].map((key) => `${key}=${params.get(key) ?? ''}`).join('; ');
    try {
      await lead.mutateAsync({ data: { name: name.trim(), email: email.trim(), message: `Requested an estimate report for ${slug}. Source page: ${window.location.pathname}. ${tracking}` } });
      setSent(true);
    } catch (reason) { setError(errMsg(reason)); }
  };
  return <section className="mt-8 rounded-2xl border border-white/10 p-5"><h3 className="font-semibold">{str(section.leadTitle, 'Email me this estimate')}</h3>{sent ? <p role="status" className="mt-3 text-sm text-emerald-300">{str(section.leadSuccess, 'Your report request has been received.')}</p> : <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><TextField label={str(section.leadNameLabel, 'Your name')} name="name" value={name} onChange={(_, value) => setName(value)} /><TextField label={str(section.leadEmailLabel, 'Work email')} name="email" value={email} onChange={(_, value) => setEmail(value)} type="email" /><button type="submit" disabled={lead.isPending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-on-brand disabled:opacity-60">{lead.isPending ? 'Sending…' : str(section.leadButton, 'Send my report')}</button>{error ? <p role="alert" className="text-sm text-red-300 sm:col-span-3">{error}</p> : null}</form>}</section>;
}

export function FreeToolsPage() {
  const section = useSection('freeTools');
  const content = useContent();
  const { slug = '' } = useParams<{ slug?: string }>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const tools = arr<AnyObj>(section.tools);
  const tool = tools.find((item) => str(item.slug) === slug);
  const categories = Array.from(new Set(tools.map((item) => str(item.category)).filter(Boolean)));
  const visibleTools = useMemo(() => tools.filter((item) => `${str(item.title)} ${str(item.description)} ${str(item.category)}`.toLowerCase().includes(query.toLowerCase())).filter((item) => category === 'all' || str(item.category) === category), [tools, query, category]);
  if (!content) return <main className="min-h-[60vh] grid place-items-center"><p role="status" className="text-sm text-muted-foreground">Loading free tools…</p></main>;
  if (slug && !tool) return <Container className="py-20"><h1 className="font-display text-3xl font-bold">Tool not found</h1><Link href="/free-tools" className="mt-4 inline-flex items-center gap-2 underline">Browse all tools <ArrowRight className="h-4 w-4" /></Link></Container>;
  if (slug && tool) return <FreeToolDetail tool={tool} section={section} />;
  return <>
    <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'Free HR tools' }]} eyebrow={str(section.eyebrow)} title={str(section.title, 'Free HR tools')} description={str(section.description)} />
    <Container>
      <div className="mb-7 grid max-w-3xl gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block text-sm font-medium">{str(section.searchLabel, 'Find a tool')}<span className="relative mt-2 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className={`${inputCls} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={str(section.searchPlaceholder)} type="search" /></span></label>
        <label className="block text-sm font-medium">{str(section.categoryLabel, 'Category')}<select className={`${inputCls} mt-2`} value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">{str(section.allCategoryLabel, 'All tools')}</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      {visibleTools.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleTools.map((item, index) => {
        const Icon = iconFor(str(item.icon));
        return <Reveal key={str(item.slug)} delay={(index % 3) * 45} className="h-full"><Link href={`/free-tools/${str(item.slug)}`} className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ph-cyan)]"><span className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04]"><Icon className="h-5 w-5 text-[color:var(--ph-cyan)]" /></span><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{str(item.category)}</span></span><h2 className="font-display mt-5 text-xl font-bold">{str(item.title)}</h2><p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{str(item.description)}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Open tool <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link></Reveal>;
      })}</div> : <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground">{str(section.emptyMessage, 'No tools match your search.')}</p>}
      <EstimateNotice text={str(section.estimateNotice)} />
    </Container>
    <CtaBand />
  </>;
}

export function FreeToolsTeaser() {
  const section = useSection('freeTools');
  const tools = arr<AnyObj>(section.tools).filter((item) => str(item.slug)).slice(0, 4);
  if (!tools.length) return null;
  return <section className="relative py-20 sm:py-28" aria-labelledby="free-tools-teaser-title"><Container>
    <SectionHead eyebrow={str(section.eyebrow)} title={str(section.title)} description={str(section.description)} />
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{tools.map((item, index) => {
      const Icon = iconFor(str(item.icon));
      return <Reveal key={str(item.slug)} delay={index * 45} className="h-full"><Link href={`/free-tools/${str(item.slug)}`} className="block h-full rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-white/25"><Icon className="h-5 w-5 text-[color:var(--ph-cyan)]" /><h3 className="mt-4 font-semibold">{str(item.title)}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{str(item.description)}</p></Link></Reveal>;
    })}</div>
    <Link href="/free-tools" id="free-tools-teaser-title" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground">Browse all free tools <ArrowRight className="h-4 w-4" /></Link>
  </Container></section>;
}

function FreeToolDetail({ tool, section }: { tool: AnyObj; section: AnyObj }) {
  const faqs = str(tool.slug) === 'tax-regime' ? arr<AnyObj>(section.taxToolFaq) : arr<AnyObj>(section.faq);
  const isRoi = str(tool.slug) === 'roi-calculator';
  return <>
    <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'Free HR tools', href: '/free-tools' }, { label: str(tool.title) }]} eyebrow={str(tool.category, 'Free HR tool')} title={str(tool.title)} description={str(tool.description)} />
    <Container className="max-w-5xl">
      <Link href="/free-tools" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />All tools</Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="glass rounded-3xl p-5 sm:p-8">
          <h2 className="font-display text-2xl font-bold">{str(tool.formTitle, 'Enter your details')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{str(tool.howItWorks, 'Enter the relevant details to see an estimate or draft. Change the inputs to compare different scenarios.')}</p>
          <div className="mt-6"><ToolBody tool={tool} section={section} /></div>
          <EstimateNotice text={str(section.estimateNotice)} />
          {isRoi ? <ToolLeadCapture section={section} slug={str(tool.slug)} /> : null}
        </section>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 p-5"><h2 className="font-semibold">How this works</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{str(tool.method, str(tool.howItWorks, 'Use the input values shown and review the assumptions before using the estimate.'))}</p><h3 className="mt-5 text-sm font-semibold">Calculation basis</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{str(tool.formula, 'The displayed result is calculated in your browser from the values entered and the assumptions shown.')}</p></div>
          <div className="rounded-2xl border border-white/10 p-5"><h2 className="font-semibold">Related tools</h2><ul className="mt-3 space-y-2">{arr<AnyObj>(section.tools).filter((item) => str(item.slug) !== str(tool.slug) && str(item.category) === str(tool.category)).slice(0, 3).map((item) => <li key={str(item.slug)}><Link className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href={`/free-tools/${str(item.slug)}`}>{str(item.title)} <ArrowRight className="h-3.5 w-3.5" /></Link></li>)}</ul></div>
        </aside>
      </div>
      {faqs.length ? <section className="mt-12"><h2 className="font-display mb-5 text-2xl font-bold">Frequently asked questions</h2><FaqList items={faqs} idPrefix={`free-tool-${safeSlug(tool.slug)}`} /></section> : null}
    </Container>
    <CtaBand />
  </>;
}
