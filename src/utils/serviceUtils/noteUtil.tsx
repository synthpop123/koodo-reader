import { classes, colors, lines } from "../../constants/themeList";
import Note from "../../model/Note";
import { showPDFHighlight } from "../fileUtils/pdfUtil";
declare var window: any;
export const renderHighlighters = async (
  notes: Note[],
  format: string,
  handleNoteClick: any
) => {
  clearHighlight();
  for (let index = 0; index < notes.length; index++) {
    const item = notes[index];
    try {
      if (format === "PDF") {
        let pageArea = document.getElementById("page-area");
        if (!pageArea) return;
        let iframe = pageArea.getElementsByTagName("iframe")[0];
        if (!iframe || !iframe.contentWindow) return;
        let iWin: any =
          iframe.contentWindow || iframe.contentDocument?.defaultView;
        showPDFHighlight(
          JSON.parse(item.range),
          classes[item.color],
          item.key,
          handleNoteClick
        );
        if (!iWin || !iWin.getSelection()) return;
        iWin.getSelection()?.empty(); // 清除文本选取
      } else {
        showNoteHighlight(
          JSON.parse(item.range),
          classes[item.color],
          item.key,
          handleNoteClick
        );
        // highlighter.highlightSelection(classes[item.color]);
      }
    } catch (e) {
      console.warn(
        e,
        "Exception has been caught when restore character ranges."
      );
      return;
    }
  }
};
export const removeOneNote = (key: string, format: string) => {
  let pageArea = document.getElementById("page-area");
  if (!pageArea) return;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe || !iframe.contentWindow) return;
  let doc = iframe.contentDocument;
  if (!doc) return;
  const elements = doc.querySelectorAll(".kookit-note");
  for (let index = 0; index < elements.length; index++) {
    const element: any = elements[index];
    const dataKey = element.getAttribute("data-key");
    if (dataKey === key) {
      element.parentNode.removeChild(element);
    }
  }
};
export const createOneNote = async (
  item: Note,
  format: string,
  handleNoteClick: any
) => {
  if (format === "PDF") {
    let pageArea = document.getElementById("page-area");
    if (!pageArea) return;
    let iframe = pageArea.getElementsByTagName("iframe")[0];
    if (!iframe || !iframe.contentWindow) return;
    let iWin: any = iframe.contentWindow || iframe.contentDocument?.defaultView;
    showPDFHighlight(
      JSON.parse(item.range),
      classes[item.color],
      item.key,
      handleNoteClick
    );
    if (!iWin || !iWin.getSelection()) return;
    iWin.getSelection()?.empty(); // 清除文本选取
  } else {
    showNoteHighlight(
      JSON.parse(item.range),
      classes[item.color],
      item.key,
      handleNoteClick
    );
  }
};
export const showNoteHighlight = (
  range: any,
  colorCode: string,
  noteKey: string,
  handleNoteClick: any
) => {
  let pageArea = document.getElementById("page-area");
  if (!pageArea) return;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe || !iframe.contentWindow) return;
  let iWin: any = iframe.contentWindow || iframe.contentDocument?.defaultView;
  let doc = iframe.contentDocument;
  if (!doc) return;

  let temp = range;
  temp = [temp];
  // sleep(500);

  window.rangy.getSelection(iframe).restoreCharacterRanges(doc, temp);
  let sel = doc!.getSelection();
  if (!sel) return;
  let newRange = sel.getRangeAt(0);
  var safeRanges: Range[] = getSafeRanges(newRange);
  for (var i = 0; i < safeRanges.length; i++) {
    highlightRange(safeRanges[i], colorCode, noteKey, handleNoteClick, doc);
  }
  if (!iWin || !iWin.getSelection()) return;
  iWin.getSelection()?.empty(); // 清除文本选取
};
function clearHighlight() {
  let pageArea = document.getElementById("page-area");
  if (!pageArea) return;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe || !iframe.contentWindow) return;
  let doc = iframe.contentDocument;
  if (!doc) return;
  const elements = doc.querySelectorAll(".kookit-note");
  for (let index = 0; index < elements.length; index++) {
    const element: any = elements[index];
    element.parentNode.removeChild(element);
  }
}

async function highlightRange(
  range: Range,
  colorCode: string,
  noteKey: string,
  handleNoteClick: any,
  doc: any
) {
  const rects = filterRects(range.getClientRects());
  for (let index = 0; index < rects.length; index++) {
    const rect = rects[index];
    var newNode = document.createElement("span");
    newNode?.setAttribute(
      "style",
      "position: absolute;" +
        (colorCode.indexOf("color") > -1
          ? "background-color: "
          : "border-bottom: ") +
        (colorCode.indexOf("color") > -1
          ? colors[colorCode.split("-")[1]] + ";opacity: 0.2"
          : `2px solid ${lines[colorCode.split("-")[1]]}`) +
        ";left:" +
        (Math.min(rect.left, rect.x) + doc.body.scrollLeft) +
        "px; top:" +
        (Math.min(rect.top, rect.y) + doc.body.scrollTop) +
        "px;" +
        "width:" +
        rect.width +
        "px; height:" +
        rect.height +
        "px; z-index:0;"
    );
    newNode.setAttribute("class", " kookit-note");
    newNode.setAttribute("data-key", noteKey);
    // newNode.setAttribute("onclick", `window.handleNoteClick()`);
    newNode.addEventListener("click", (event) => {
      if (event && event.target) {
        if (
          (event.target as any).dataset &&
          (event.target as any).dataset.key
        ) {
          handleNoteClick(event);
        }
      }
    });
    doc.body.appendChild(newNode);
  }
}
function filterRects(rects: any) {
  let result: any = [];
  let lastRect: any = null;
  let lineHeight = getLineHeight(rects);
  let lineWidth = getLineWidth(rects);
  for (let index = 0; index < rects.length; index++) {
    const rect = rects[index];

    if (Math.abs(rect.height - lineHeight) > 1 && rect.width === lineWidth) {
      continue;
    }

    if (lastRect) {
      if (rect.top === lastRect.top && rect.left === lastRect.left) {
        continue;
      }
    }
    result.push(rect);
    lastRect = rect;
  }

  return result;
}
function getLineHeight(rects: any[]) {
  let arr = Array.from(rects)
    .filter((item) => item.height > 0)
    .map((item) => item.height);
  let frequency = {};
  let maxCount = 0;
  let result;
  console.log(arr);
  for (let num of arr) {
    frequency[num] = (frequency[num] || 0) + 1;
    if (frequency[num] > maxCount) {
      maxCount = frequency[num];
      result = num;
    } else if (frequency[num] === maxCount) {
      result = Math.min(result, num);
    }
  }
  console.log(result, "result");
  return result;
}
function getLineWidth(rects: any[]) {
  let arr = Array.from(rects)
    .filter((item) => item.width > 0)
    .map((item) => item.width);
  return Math.max(...arr);
}
function getSafeRanges(dangerous) {
  var a = dangerous.commonAncestorContainer;
  // Starts -- Work inward from the start, selecting the largest safe range
  var s = new Array(0),
    rs = new Array(0);
  if (dangerous.startContainer !== a) {
    for (let i = dangerous.startContainer; i !== a; i = i.parentNode) {
      s.push(i);
    }
  }
  if (s.length > 0) {
    for (let i = 0; i < s.length; i++) {
      var xs = document.createRange();
      if (i) {
        xs.setStartAfter(s[i - 1]);
        xs.setEndAfter(s[i].lastChild);
      } else {
        xs.setStart(s[i], dangerous.startOffset);
        xs.setEndAfter(
          s[i].nodeType === Node.TEXT_NODE ? s[i] : s[i].lastChild
        );
      }
      rs.push(xs);
    }
  }

  // Ends -- basically the same code reversed
  var e = new Array(0),
    re = new Array(0);
  if (dangerous.endContainer !== a) {
    for (var i = dangerous.endContainer; i !== a; i = i.parentNode) {
      e.push(i);
    }
  }
  if (e.length > 0) {
    for (let i = 0; i < e.length; i++) {
      var xe = document.createRange();
      if (i) {
        xe.setStartBefore(e[i].firstChild);
        xe.setEndBefore(e[i - 1]);
      } else {
        xe.setStartBefore(
          e[i].nodeType === Node.TEXT_NODE ? e[i] : e[i].firstChild
        );
        xe.setEnd(e[i], dangerous.endOffset);
      }
      re.unshift(xe);
    }
  }

  // Middle -- the uncaptured middle
  if (s.length > 0 && e.length > 0) {
    var xm = document.createRange();
    xm.setStartAfter(s[s.length - 1]);
    xm.setEndBefore(e[e.length - 1]);
  } else {
    return [dangerous];
  }

  // Concat
  rs.push(xm);
  let response = rs.concat(re);

  // Send to Console
  return response;
}
