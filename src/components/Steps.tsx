export enum StepName {
  ChooseImage = 1,
  SetMaskPoint = 2,
  GenerateMask = 3,
  ChooseMask = 4,
  DefinePrompt = 5,
  Generate = 6,
}

export interface StepsProps {
  classNames?: string;
  currentStep: StepName;
}

interface StepInfo {
  name: StepName;
  label: string;
}

function Step(props: StepInfo & { status: "active" | "inactive" }) {
  let stepClass = "";
  if (props.status === "active") {
    stepClass = "step-primary";
  }
  return <li className={`step ${stepClass}`}>{props.label}</li>;
}

const STEPS_DATA: StepInfo[] = [
  { name: StepName.ChooseImage, label: "Choose an image" },
  { name: StepName.SetMaskPoint, label: "Set mask reference" },
  { name: StepName.GenerateMask, label: "Generate masks" },
  { name: StepName.ChooseMask, label: "Choose mask" },
  { name: StepName.DefinePrompt, label: "Define prompt" },
  { name: StepName.Generate, label: "Generate" },
];
export default function Steps(props: StepsProps) {
  return (
    <ul className={`steps ${props.classNames ?? ""}`}>
      {STEPS_DATA.map((step) => (
        <Step
          key={step.name}
          status={props.currentStep < step.name ? "inactive" : "active"}
          {...step}
        />
      ))}
    </ul>
  );
}
