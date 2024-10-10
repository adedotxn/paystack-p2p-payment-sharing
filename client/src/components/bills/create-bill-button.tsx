import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function CreateBillButton(props: { full?: boolean }) {
  const navigate = useNavigate();

  function handleClick() {
    navigate("/create-bill");
  }

  return (
    <>
      <Button
        onClick={handleClick}
        className={`${props.full ? "w-full" : "w-fit"}`}
      >
        <Plus className="mr-2 h-4 w-4" /> Create New Bill
      </Button>
    </>
  );
}
