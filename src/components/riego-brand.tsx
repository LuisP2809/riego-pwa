type Props = {className?: string; subtitle?: string};

export default function RiegoBrand({className = "", subtitle = "Control de campo"}: Props) {
  return <div className={`brand ${className}`}>
    <span className="brandmark"><img src={import.meta.env.BASE_URL + "favicon.svg"} alt="" width={48} height={48}/></span>
    <div className="brand-copy"><strong>Riego</strong><span>{subtitle}</span></div>
  </div>;
}
