import React, { useEffect, useState } from "react";
import CodeEditorWindow from "./CodeEditorWindow";
import axios from "axios";
import { classnames } from "../utils/general";
import { languageOptions } from "../constants/languageOptions";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { defineTheme } from "../lib/defineTheme";
import useKeyPress from "./useKeyPress";
import Footer from "./Footer";
import OutputWindow from "./OutputWindow";
import CustomInput from "./CustomInput";
import OutputDetails from "./OutputDetails";
import ThemeDropdown from "./ThemeDropdown";
import LanguagesDropdown from "./LanguageDropdown";

const javascriptDefault = `// Sample Snippet
function Add(a,b){
  return a+b;
}
let res = Add(2,3);
console.log(res)`;

const Landing = () => {
  const [code, setCode] = useState(javascriptDefault);
  const [customInput, setCustomInput] = useState("");
  const [outputDetails, setOutputDetails] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [theme, setTheme] = useState("cobalt");
  const [language, setLanguage] = useState(languageOptions[0]);
  const [savedSnippets, setSavedSnippets] = useState([]);

  const enterPress = useKeyPress("Enter");
  const ctrlPress = useKeyPress("Control");

  const clearHandler = () => {
    setCode('')
    setCustomInput('')
  }

  const copyHandler = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showSuccessToast('Code Copied!')
    } catch (err) {
      showErrorToast('Failed to copy text');
    }
  }
  const onSelectChange = (sl) => {
    console.log("selected Option...", sl);
    setLanguage(sl);
  };

  useEffect(()=>{
    toast.info(`Welcome to CodeArena 👋🏻,Happy Coding 👨🏻‍💻!!!`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
    });
  },[])

  useEffect(() => {
    if (enterPress && ctrlPress) {
      console.log("enterPress", enterPress);
      console.log("ctrlPress", ctrlPress);
      handleCompile();
    }
  }, [ctrlPress, enterPress]);
  const onChange = (action, data) => {
    switch (action) {
      case "code": {
        setCode(data);
        break;
      }
      default: {
        console.warn("case not handled!", action, data);
      }
    }
  };

  const handleCompile = () => { // this methods(POST) sends our code and languageid to judge0 api for compiling which in turn creates a process with a token in case of success and error message in case of failure
    setProcessing(true);
    const formData = {
      language_id: language.id,
      // encode source code in base64
      source_code: btoa(code),
      stdin: btoa(customInput),
    };
    const options = {
      method: "POST",
      url: import.meta.env.VITE_RAPID_API_URL,
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "content-type": "application/json",
        "Content-Type": "application/json",
        "X-RapidAPI-Host": import.meta.env.VITE_RAPID_API_HOST,
        "X-RapidAPI-Key": import.meta.env.VITE_RAPID_API_KEY,
      },
      data: formData,
    };
    axios
      .request(options)
      .then(function (response) {
        console.log("res.data", response.data);
        const token = response.data.token;
        checkStatus(token); // makes get reuqest with token in param to check the status like passed -> returns response with status, else failed then returns error message
      })
      .catch((err) => {
        let error = err.response ? err.response.data : err;
        // get error status
        let status = err.response.status;
        console.log("status", status);
        if (status === 429) {
          console.log("too many requests", status);
          showErrorToast(
            `Quota of 100 requests exceeded for the Day!`,
            10000
          );
        }
        setProcessing(false);
        console.warn("catch block of handleCompile", error);
      });
  };

  const checkStatus = async (token) => { // async as it has to await for the get token polling request result
    const options = {
      method: "GET",
      url: import.meta.env.VITE_RAPID_API_URL + "/" + token,
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "X-RapidAPI-Host": import.meta.env.VITE_RAPID_API_HOST,
        "X-RapidAPI-Key": import.meta.env.VITE_RAPID_API_KEY,
      },
    };
    try {
      let response = await axios.request(options);
      let statusId = response.data.status?.id;

      if (statusId === 1 || statusId === 2) {
        // still processing
        setTimeout(() => {
          checkStatus(token)
        }, 2000)
        return
      } else {// Processed - we have a result
        setProcessing(false)
        setOutputDetails(response.data)
        showSuccessToast(`Compiled Successfully!`)
        console.log('response.data', response.data)
        return
      }
    } catch (err) {// code compilation failed
      console.log("err", err);
      setProcessing(false);
      showErrorToast();
    }
  };

  function handleThemeChange(th) {
    const theme = th;
    console.log("theme...", theme); // this is an object {label: themeName,value: themeId,key: themeId,}
    if (["light", "vs-dark"].includes(theme.value)) {
      setTheme(theme);
    } else {
      defineTheme(theme.value).then((_) => setTheme(theme));// defineTheme sets the monaco.editor.defineTheme in promise, after that we update state with current theme object
    }
  }
  useEffect(() => {
    defineTheme("oceanic-next").then((_) =>
      setTheme({ value: "oceanic-next", label: "Oceanic Next" })
    );
  }, []);

  const showSuccessToast = (msg) => {
    toast.success(msg || `Compiled Successfully!`, {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };
  const showErrorToast = (msg) => {
    toast.error(msg || `Something went wrong! Please try again.`, {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const loadSnippet = (snippet) => {
    setCode(snippet.code);
    showSuccessToast('Snippet loaded!');
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedSnippets')) || [];
    setSavedSnippets(saved);
  }, []);

  const handleSave = () => {
    const snippetName = prompt("Enter a name for your snippet:");
    if (snippetName) {
      const newSnippet = {
        name: snippetName,
        code: code,
      };
      const updatedSnippets = [...savedSnippets, newSnippet];
      setSavedSnippets(updatedSnippets);
      localStorage.setItem('savedSnippets', JSON.stringify(updatedSnippets));
      showSuccessToast('Snippet saved!');
    }
  };

  const handleDelete = (name) => {
    const updatedSnippets = savedSnippets.filter(snippet => snippet.name !== name);
    setSavedSnippets(updatedSnippets);
    localStorage.setItem('savedSnippets', JSON.stringify(updatedSnippets));
    showSuccessToast('Snippet deleted!');
  };

  return (
      <div className="border-4 animated-border">
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="flex flex-col md:flex-row md:items-center mb-4 cursor-pointer">
          <div className="px-4 py-2 text-orange-700 font-bold">
            Language: <LanguagesDropdown onSelectChange={onSelectChange} />
          </div>
          <div className="px-4 py-2 text-orange-700 font-bold">
            Theme:<ThemeDropdown handleThemeChange={handleThemeChange} theme={theme} />
          </div>
          <div className="flex flex-row mt-5 md:space-x-2">
          <button className="ml-2 border-2 border-black z-10 rounded-md  shadow-[5px_5px_0px_0px_rgba(0,0,0)] px-4 py-2 hover:shadow-lg transition duration-200 bg-white flex-shrink-0 hover:text-green-600 mt-2 md:mt-0 w-fit" onClick={copyHandler}>
             Copy Snippet
            </button>
            <button className="ml-2 border-2 border-black z-10 rounded-md shadow-[5px_5px_0px_0px_rgba(0,0,0)] px-4 py-2 hover:shadow-lg transition duration-200 bg-white flex-shrink-0 hover:text-blue-400 mt-2 md:mt-0 w-fit" onClick={handleSave}>
              Save Snippet
            </button>
            <button className="ml-2 border-2 border-black z-10 rounded-md  shadow-[5px_5px_0px_0px_rgba(0,0,0)] px-4 py-2 hover:shadow-lg transition duration-200 bg-white flex-shrink-0 hover:text-red-700 mt-2 md:mt-0 w-fit" onClick={clearHandler}>
              Reset
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-start px-4 py-4">
          <div className="flex flex-col w-full h-full md:w-2/3">
            <CodeEditorWindow
              code={code}
              onChange={onChange}
              language={language?.value}
              theme={theme.value}
            />
          </div>
  
          <div className="right-container flex flex-col w-full md:w-1/3">
            <OutputWindow outputDetails={outputDetails} />
            <div className="flex flex-col items-end mt-4">
              <CustomInput
                customInput={customInput}
                setCustomInput={setCustomInput}
              />
              <button
                onClick={handleCompile}
                disabled={!code}
                className={classnames(
                  "mt-4 border-2 border-black z-10 rounded-md shadow-[5px_5px_0px_0px_rgba(0,0,0)] px-4 py-2 hover:shadow-lg transition duration-200 bg-white flex-shrink-0",
                  !code ? "opacity-50" : ""
                )}
              >
                {processing ? "Processing..." : "Compile and Execute"}
              </button>
            </div>
            {outputDetails && <OutputDetails outputDetails={outputDetails} />}
            <div className="mt-2 ">
              <h3 className="font-bold">{savedSnippets.length ? `Saved Snippets:` : ''}</h3>
              <p className="text-xs m-1">{savedSnippets.length ? `(Select snippet to load)` : ''}</p>
              <ol className="list-disc pl-4 h-36 overflow-y-scroll">
                {savedSnippets.length ? savedSnippets.map((snippet, index) => (
                  <li key={index} className="flex items-center px-4 py-2 space-x-2 border-gray-800 border-2 rounded-md bg-gray-100 justify-between m-2">
                    <div className="cursor-pointer text-gray-900 text-sm hover:text-orange-600" onClick={() => loadSnippet(snippet)}>
                      📁 {snippet.name}
                    </div>
                    <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(snippet.name)}>
                      &#10005;
                    </button>
                  </li>
                )) : ''}
              </ol>
            </div>
          </div>
        </div>
        <Footer />
      </div>
  );
};
export default Landing;