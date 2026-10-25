export interface Incident {
  id: string;
  unit: string;
  units?: string[];
  time: string;
  date: string;
  message: string;
  category: "BRANDEINSATZ" | "TECHNISCHE HILFE" | "HILFELEISTUNG" | "INFO";
  color: "red" | "green" | "orange" | "blue" | "gray";
  type: string;
  title?: string;
  location?: string;
  status: string;
}
