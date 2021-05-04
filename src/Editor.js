import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill'; 
import 'react-quill/dist/quill.snow.css';
import './Editor.css';
import { io } from "socket.io-client";
import { useParams } from 'react-router-dom';

const SAVE_INTERVAL_MS = 2000;

function Editor() {
  const [body, setBody] = useState("");
  const [socket, setSocket] = useState();
  const [editor, setEditor] = useState();

  const {id} = useParams();

  const quillRef = useRef();

  useEffect(() => {
    const s = io('http://localhost:4000');
    setSocket(s)

    return () => {
      s.disconnect();
    }
  }, []);

  useEffect(() => {
    if(socket == null) return;

    setEditor(quillRef.current.getEditor())

    const handler = data => {
      setBody(data);
    }

    socket.on('receive-changes', handler)
  }, [socket]);

  useEffect(() => {
    if(socket == null) return;

    socket.emit('get-document', id);

    socket.once('load-document', document => {
      setBody(document);
    })

    socket.emit('join-room', id);

  }, [socket, id]);

  useEffect(() => {
    if(socket == null || editor == null) return;

    const interval = setInterval(() => {
      const data = editor.getContents();
      socket.emit('save-document', data)
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval)
    }
  }, [socket, editor])

  const handleChange = (content, delta, source, editor) => {
    if (source !== 'user') return
    const data = editor.getContents()
    socket.emit('send-changes', data);
  }

  return (
    <div className="editor">
      <ReactQuill value={body}
                  onChange={handleChange}
                  modules={modules}
                  formats={formats}
                  name="editor"
                  ref={quillRef} />
    </div>
  );
}

const modules = {
  toolbar: [
    [{ "font": [] }, { "size": ["small", false, "large", "huge"] }], // custom dropdown

    ["bold", "italic", "underline", "strike"],

    [{ "color": [] }, { "background": [] }],

    [{ "script": "sub" }, { "script": "super" }],

    [{ "header": 1 }, { "header": 2 }, "blockquote", "code-block"],

    [{ "list": "ordered" }, { "list": "bullet" }, { "indent": "-1" }, { "indent": "+1" }],

    [{ "direction": "rtl" }, { "align": [] }],

    ["link", "image", "video", "formula"],

    ["clean"]
]
}

const formats = [
  "header", "font", "size", "bold", "italic", "underline", "strike", "blockquote", "list", "bullet", "link", "image", "video", "code-block"
]

export default Editor;
