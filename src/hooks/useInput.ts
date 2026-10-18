export default function useInput(defaultValue: string = ""): [
  { value: string },
  (event: any) => void,
  (v: string) => void
] {
  let val = defaultValue;
  const value = {
    get value() {
      return val;
    },
    set value(v: string) {
      val = v;
    },
  };

  function handleValueChange(event: any) {
    value.value = event?.target?.value !== undefined ? event.target.value : event;
  }

  return [
    value,
    handleValueChange,
    (v: string) => {
      value.value = v;
    },
  ];
}
