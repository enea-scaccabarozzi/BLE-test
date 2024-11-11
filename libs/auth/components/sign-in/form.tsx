import { Formik, FormikHelpers } from "formik";
import { AnimatePresence, MotiView } from "moti";
import { View } from "react-native";
import * as Yup from "yup";

import { Button } from "@app/shared/components/button";
import { Input } from "@app/shared/components/input";
import { Text } from "@app/shared/components/text";
import { useToast } from "@app/shared/hooks/use-toast";
import { AppErrorType, AppResultAsync } from "@app/shared/types/errors";

interface IProps {
  onSuccess: () => void;
  onSubmit: (email: string, password: string) => AppResultAsync<true>;
  stage: 1 | 2;
  setStage: (stage: 1 | 2) => void;
}

interface IForm {
  email: string;
  password: string;
}

export const SigninForm = ({
  onSubmit,
  onSuccess,
  stage,
  setStage,
}: IProps) => {
  const { toast } = useToast();

  const validation = Yup.object().shape({
    email: Yup.string()
      .email("Enter a valid email")
      .required("This field is mandatory"),
    password: Yup.string().required("This field is mandatory"),
  });

  const handleSubmit = (values: IForm, actions: FormikHelpers<IForm>) => {
    actions.setSubmitting(true);
    // eslint-disable-next-line neverthrow/must-use-result
    onSubmit(values.email, values.password)
      .map(() => onSuccess())
      .map(() => actions.setSubmitting(false))
      .mapErr((err) =>
        toast(
          err.type === AppErrorType.PublicError
            ? (err.publicDetails ?? err.publicMessage)
            : err.message,
          "destructive",
        ),
      )
      .mapErr(() => actions.setSubmitting(false));
  };

  const initialValues: IForm = { email: "", password: "" };

  return (
    <AnimatePresence exitBeforeEnter>
      <Formik
        initialValues={initialValues}
        validationSchema={validation}
        onSubmit={handleSubmit}
      >
        {(formik) => (
          <View className="flex align-center flex-col justify-center w-full">
            {stage === 1 && (
              <MotiView
                from={{ translateX: -500, opacity: 0 }}
                exit={{ translateX: -500, opacity: 0 }}
                animate={{ translateX: 0, opacity: 1 }}
                transition={{
                  translateX: {
                    type: "spring",
                    duration: 5000,
                  },
                  opacity: {
                    type: "timing",
                    duration: 1500,
                  },
                }}
                key="stage-1-inputs"
              >
                <Input
                  label="Mail"
                  invalid={
                    formik.errors?.email !== undefined && formik.touched.email
                  }
                  onChangeText={formik.handleChange("email")}
                  value={formik.values.email}
                  annotation={formik.errors.email}
                  keyboardType="email-address"
                  placeholder="Enter your email"
                  autoCapitalize="none"
                />
              </MotiView>
            )}

            {stage === 2 && (
              <MotiView
                from={{ translateX: -500, opacity: 0 }}
                exit={{ translateX: -500, opacity: 0 }}
                animate={{ translateX: 0, opacity: 1 }}
                transition={{
                  translateX: {
                    type: "spring",
                    duration: 5000,
                  },
                  opacity: {
                    type: "timing",
                    duration: 1500,
                  },
                }}
                key="stage-2-inputs"
              >
                <Input
                  label="Password"
                  invalid={
                    formik.errors?.password !== undefined &&
                    formik.touched.password
                  }
                  onChangeText={formik.handleChange("password")}
                  value={formik.values.password}
                  annotation={
                    formik.touched.password === true
                      ? formik.errors.password
                      : undefined
                  }
                  placeholder="Your password"
                  autoCapitalize="none"
                  textContentType="password"
                  secureTextEntry
                />
              </MotiView>
            )}

            {stage === 1 && (
              <MotiView
                from={{ translateX: -500, opacity: 0 }}
                exit={{ translateX: -500, opacity: 0 }}
                animate={{ translateX: 0, opacity: 1 }}
                transition={{
                  translateX: {
                    type: "spring",
                    duration: 5000,
                  },
                  opacity: {
                    type: "timing",
                    duration: 1500,
                  },
                }}
                key="stage-1-buttons"
              >
                <Button
                  onPress={() => setStage(2)}
                  className="mt-2"
                  disabled={!formik.dirty || formik.errors.email !== undefined}
                >
                  <Text>Continue</Text>
                </Button>
              </MotiView>
            )}
            {stage === 2 && (
              <MotiView
                from={{ translateX: -500, opacity: 0 }}
                exit={{ translateX: -500, opacity: 0 }}
                animate={{ translateX: 0, opacity: 1 }}
                transition={{
                  translateX: {
                    type: "spring",
                    duration: 5000,
                  },
                  opacity: {
                    type: "timing",
                    duration: 1500,
                  },
                }}
                key="stage-2-buttons"
              >
                <Button
                  onPress={() => handleSubmit(formik.values, formik)}
                  className="mt-2"
                  disabled={
                    formik.isSubmitting || !formik.isValid || !formik.dirty
                  }
                >
                  <Text>{formik.isSubmitting ? "Submitting..." : "Login"}</Text>
                </Button>
                <Button
                  onPress={() => setStage(1)}
                  className="mt-2"
                  variant="secondary"
                >
                  <Text>Go Back</Text>
                </Button>
              </MotiView>
            )}
          </View>
        )}
      </Formik>
    </AnimatePresence>
  );
};
