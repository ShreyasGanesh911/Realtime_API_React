import { Bounce, toast } from "react-toastify";

export const successToast = (msg:string)=>{
    toast.success(msg, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
        });
}