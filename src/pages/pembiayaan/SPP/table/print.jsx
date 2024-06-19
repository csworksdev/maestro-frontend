import React, { forwardRef } from "react";
import "@/assets/scss/print.css";
export const Print = forwardRef((props, ref) => {
  return (
    <div ref={ref} className="m-5">
      <table className="w-full">
        <thead className="text-center">
          <tr>
            <td colSpan={5} className="font-bold">
              KAB. RAJA AMPAT
            </td>
          </tr>
          <tr>
            <td colSpan={5} className="font-bold">
              REGISTER SPP LS
            </td>
          </tr>
          <tr>
            <td colSpan={5} className="font-bold">
              DINAS PEKERJAAN UMUM DAN PENATAAN RUANG
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-center font-bold">NOMOR</td>
            <td className="text-center font-bold">TANGGAL</td>
            <td className="text-center font-bold">NOMOR SPP</td>
            <td className="text-center font-bold">URAIAN</td>
            <td className="text-center font-bold">JUMLAH SPP</td>
          </tr>
          <tr>
            <td className="text-center font-bold"></td>
            <td className="text-center font-bold"></td>
            <td className="text-center font-bold"></td>
            <td className="text-center font-bold"></td>
            <td className="text-right font-bold">0</td>
          </tr>

          <tr>
            <td colSpan={4} className="text-right font-bold">
              Total
            </td>
            <td className="text-right font-bold"> 0</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="text-center">
              Mengetahui,
            </td>
            <td colSpan={2}></td>
            <td colSpan={2} className="text-center">
              Warisai, {new Date().toLocaleDateString("id-ID")}
            </td>
          </tr>
          <tr className="mt-5">
            <td colSpan={2} className="text-center">
              <span className="font-bold">Pengguna Anggaran</span>
            </td>
            <td colSpan={2}></td>
            <td colSpan={2} className="text-center">
              Bendahara Anggaran
            </td>
          </tr>
          <tr className="">
            <td colSpan={2} className="text-center">
              <span className="underline">Abdulah Hasan</span>
            </td>
            <td colSpan={2}></td>
            <td colSpan={2} className="text-center">
              <span className="underline">Mohammad Irfan Lestusen</span>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="text-center">
              NIP. 196408151987021004
            </td>
            <td colSpan={2}></td>
            <td colSpan={2} className="text-center">
              NIP. 198304082015051001
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});

export default Print;
