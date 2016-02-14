//变量声明
var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};

//所请求的文件不存在时发送404错误
function send404(response){
	response.writeHead(404,{'Content-Type':'text/plain'});
	response.write('Error 404: resource not found.'); 
	response.end();
}

//提供文件数据服务
function sendFile(response,filePath,fileContents){
	response.writeHead(200,{"content-type": mime.lookup(path.basename(filePath))} );
	response.end(fileContents);
}

//提供静态文件服务
function serveStatic(response, cache, absPath){
	//检查文件是否缓存在内存中
	if(cache[absPath]){
		//返回文件
		 sendFile(response, absPath, cache[absPath]);
	}else{
		//检查文件是否存在
		fs.exists(absPath,function(err,data){
			if(exists){
				fs.readFile(absPath, function(err, data){
					if(err){
						send404(response);
					}else{
						cache[absPath] =  data;
						sendFile(response, absPath, cache[absPath]);
					}
				})
			}else{
				send404(response);
			}
		})
	}
}