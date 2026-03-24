export const FieldErrorText = ({ message }: { message?: string | null }) => {
  if (!message) {
    return null;
  }

  return <span className="field-error-text">{message}</span>;
};
