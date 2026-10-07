type Props={label:string;value:string;onChange:(value:string)=>void;options:{value:string;label:string}[]};

export default function FieldPicker({label,value,onChange,options}:Props){
  return <label className="field">
    <span>{label}</span>
    <select aria-label={label} value={value} onChange={event=>onChange(event.target.value)}>
      {options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}
