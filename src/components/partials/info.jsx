import React from "react";
import { useSelector } from "react-redux";
import wbg6 from "@/assets/images/all-img/widget-bg-5.png";
import vectorImage2 from "@/assets/images/svg/widgetvector2.svg";
import Button from "../ui/Button";

const Info = () => {
  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);

  const getWhatsAppLink = () => {
    const countryCode = "+6281220450240"; // Indonesia country code, modify as per your requirement
    return `https://wa.me/${countryCode}/?text=Assalamualaikum aa, mau nanya`;
  };

  return (
    <div
      className="bg-no-repeat bg-cover bg-center p-5 rounded-[6px] relative flex items-center"
      style={{
        backgroundImage: `url(${wbg6})`,
      }}
    >
      <div className="flex-1">
        <div className="max-w-[180px]">
          <div className="text-xl font-medium text-white dark:text-slate-800 mb-2">
            <span className="block font-normal">Halo kak,</span>
            <span className="block">{user_name}</span>
          </div>
          <p className="text-sm text-wgite text-white dark:text-slate-800 font-semibold">
            Untuk siswa yang Tanggal Ordernya sebelum tanggal 21 Oktober 2024,
            silahkan mengisi absen di Heroku, jika bingung silahkan
            <Button
              variant="contained"
              // href={getWhatsAppLink(student.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-success btn-sm"
              link={getWhatsAppLink()}
            >
              cek khodam
            </Button>
            <br />
            Terima kasih
          </p>
        </div>
      </div>
      <div className="flex-none">
        <img src={vectorImage2} alt="" className="ml-auto" />
      </div>
    </div>
  );
};

export default Info;
