// ==UserScript==
// @name         luogu note
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  可以对于某道题写一些自己的笔记，方便复习
// @author       konyakest
// @match        https://www.luogu.com.cn/problem/*
// @match        https://www.luogu.com.cn/paste/*
// @icon         https://www.luogu.com.cn/favicon.ico
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// ==/UserScript==

/*
使用方法：将下面的 PASTEID 改为自己的一个闲置剪切板。
**请保证你不会使用这个剪切板，防止数据丢失**
*/

const PASTEID = "";

//示例：const PASTEID = "zpjc302z";

const CURRENT_PROBLEM = "current_problem";

var has_built = false;

async function changePaste(pasteid,data){
    console.log(JSON.stringify({"data":data}));
    await fetch(`https://www.luogu.com.cn/paste/edit/${pasteid}`, {
        "credentials": "include",
        "headers": {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": document.querySelector("meta[name=csrf-token]").content,
            "Content-Type": "application/json",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin"
        },
        "body": JSON.stringify({"data":data}),
        "method": "POST",
        "mode": "cors"
    });
}

async function inPaste(){
    let problem = GM_getValue(CURRENT_PROBLEM);
    if(!problem){
        console.log("inPaste return");
        return;
    }
    let div = document.querySelector(".actions");
    let button = div.childNodes[2].cloneNode(true);
    button.innerText=`保存为 ${problem} 的笔记`;
    div.appendChild(div.childNodes[1].cloneNode(true));
    div.appendChild(button);
    button.onclick = function(){
        GM_setValue(`note_of_${problem}`,
            {
                html: document.querySelector(".marked").innerHTML,
                code: unsafeWindow._feInjection.currentData.paste.data
            }
        );
        alert("保存成功");
        GM_deleteValue(CURRENT_PROBLEM,problem);
    };
}

async function delay(){
    await fetch("https://www.luogu.com.cn/problem/P1000");
}

async function inProblem(){
    let problem = window.location.href.split('/')[4];
    let nodes = [
        document.querySelector("h2.lfe-h2:nth-child(1)").cloneNode(true),
        document.querySelector("div.marked:nth-child(2)").cloneNode(true)
    ];
    nodes[0].innerHTML = "显示笔记";
    nodes[1].style.display = "none";
    nodes[0].addEventListener('click',function(){
        if(nodes[0].innerHTML == "显示笔记"){
            nodes[0].innerHTML = "隐藏笔记";
            nodes[1].style.display = "";
        }
        else{
            nodes[0].innerHTML = "显示笔记";
            nodes[1].style.display = "none";
        }
    });
    //console.log("get value");
    let value = GM_getValue(`note_of_${problem}`);
    if(value) value = value.html;
    //console.log("get value finished");
    nodes[1].innerHTML = value ? value : "你还没有创建笔记，点击上方按钮创建一篇吧！";
    document.querySelector(".problem-card > div:nth-child(2)").insertBefore(
        nodes[1],
        document.querySelector("h2.lfe-h2:nth-child(1)")
    );
    document.querySelector(".problem-card > div:nth-child(2)").insertBefore(
        nodes[0],
        nodes[1]
    );

    let tmp = document.querySelector(".operation > span:nth-child(3)");
    let tmp2 = tmp.cloneNode(true);
    tmp.parentNode.appendChild(tmp2);
    tmp2.childNodes[0].childNodes[0].innerText = value ? "修改笔记" : "创建笔记";
    tmp2.onclick = async function(){
        console.log("set current problem",problem);
        GM_setValue(CURRENT_PROBLEM,problem);
        if(value){
            await changePaste(PASTEID,GM_getValue(`note_of_${problem}`).code);
        }
        else{
            await changePaste(PASTEID,"");
        }
        window.open(`https://www.luogu.com.cn/paste/${PASTEID}`);
    };
}

function buildproblempaste() {
    if (has_built) return;
    has_built = true;
    window.location.href.split('/')[3] === "problem" ? inProblem() : inPaste();
}

window.addEventListener('load', buildproblempaste);
setTimeout(buildproblempaste, 500);
