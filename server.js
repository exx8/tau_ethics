function handle(request, response) {
  let path = request.path;
  if (path === '/') {
    path += 'index.html';
  }
  if (path === '/add_point') {
    localStorage.setItem(request.param.id, request.param.data);
    response.sendJSON({ 'status': 'ok' });

  } else if (path === '/all_points') {
    const allPoints = {...localStorage};
    response.sendJSON(allPoints);
  }
  else if (path==='/delete')
  {
    localStorage.removeItem(request.param.id);
    response.sendJSON({ 'status': 'ok' });

  } else {
    getFile('public' + path).subscribe(file => {
      response.sendFile(file);
    }, err => {
      response.sendText('Page not found');
    });
  }
}
