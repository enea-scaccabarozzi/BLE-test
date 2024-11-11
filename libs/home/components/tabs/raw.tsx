import { DataMeasurements } from "@app/bms-protocol";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@app/shared/components/card";
import { Text } from "@app/shared/components/text";

interface IProps {
  data: DataMeasurements | null;
}

export const RawTabComponent = ({ data }: IProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw</CardTitle>
        <CardDescription>Raw data will be logged here</CardDescription>
      </CardHeader>
      <CardContent className="gap-4 native:gap-2">
        <Text>{JSON.stringify(data, null, 2)}</Text>
      </CardContent>
    </Card>
  );
};
