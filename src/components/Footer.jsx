import React from "react";

const Footer = () => {
  return (
    <div className=" h-8 bottom-0 px-2 py-1 flex items-center justify-center w-full text-xs text-black font-normal">
      <span>
        Built with{" "}
        ❤️
        by{" "}
        <a
          href="https://dhanushholla.vercel.app"
          target="__blank"
          className="  hover:bg-white-500 hover:text-orange-500"
        >
          Dhanush Holla ↗️{" "}
        </a>
        &  inspired from {" "}
        <a
          href="https://manuarora.in"
          target="__blank"
          className=" hover:bg-white-500 hover:text-green-400"
        >
          Manu Arora ↗️{" "}
        </a>
      </span>
    </div>
  );
};

export default Footer;