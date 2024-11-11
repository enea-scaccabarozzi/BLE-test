import { Text, TextInput, View } from "react-native";

const defaultContainerClasses = "flex flex-col gap-1.5";
const defaultLabelClasses =
  "text-black dark:text-white text-sm font-medium leading-none";
const defaultInputClasses =
  "border border-gray-700 bg-white py-2.5 px-4 rounded-lg dark:bg-black text-black dark:text-white";
const defaultInvalidInputClasses =
  "border border-red-700 bg-white py-2.5 px-4 rounded-lg dark:bg-black text-red-700 dark:text-white";
const defaultAnnotationClasses = "text-base text-red-700 dark:text-white";

interface InputProps extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  invalid?: boolean;
  annotation?: string;
  containerClasses?: string;
  inputClasses?: string;
  labelClasses?: string;
  invalidInputClasses?: string;
  annotationClasses?: string;
}

function Input({
  label,
  invalid,
  annotation,
  containerClasses = defaultContainerClasses,
  inputClasses = defaultInputClasses,
  labelClasses = defaultLabelClasses,
  invalidInputClasses = defaultInvalidInputClasses,
  annotationClasses = defaultAnnotationClasses,
  ...props
}: InputProps) {
  return (
    <View className={containerClasses}>
      {label && <Text className={labelClasses}>{label}</Text>}
      <TextInput
        className={invalid ? invalidInputClasses : inputClasses}
        {...props}
      />
      {annotation && <Text className={annotationClasses}>{annotation}</Text>}
    </View>
  );
}

export { Input };
