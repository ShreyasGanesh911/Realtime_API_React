import { ReactNode } from "react";

type ButtonProps = {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function Button({ icon, children, onClick, className = "" }: ButtonProps) {
  return (
    <button
      className={`rounded-full xl:p-4 p-2 flex border border-blue-200 items-center gap-1 hover:opacity-90 hover:cursor-pointer ${className} font-semibold`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
