/* Incoming */

function handleResponse(json) {
  if (json.filename) {
    console.log(`Received ${json.filename}`);
    json.filename = json.filename.replace(/\./g, '_');
  }

  // All messages end up here, so first the type of message needs to be determined.
  // - Coordinates
  if (json.message.lat && json.message.lon) {
    map.panTo(new L.LatLng(json.message.lat, json.message.lon));
    return;
  }

  // - user input
  if (json.message.modalType) {
    $(`#${json.filename}`).remove();

    const modal = generateModal(json.message.modalType, json.message.text, json.filename)
    modal.modal({ backdrop: 'static' })

    const buttons = json.message.actions.map(action => {
      const btn = $(`<button type="button" class="btn btn-primary" data-dismiss="modal"></button>`).text(action);
      action = action.toLowerCase();

      switch (json.message.modalType) {
        case 'error':
        case 'question':
          btn.click(() => {
            reply(action)
          });
          break;
        case 'input':
          if (action === 'yes' || action === 'ok') {
            const input = modal.find(`#${json.filename}-input`);
            btn.click(() => {
              reply(input.val());
            });
          }
          break;
        case 'upload':
          if (action === 'yes' || action === 'ok') {
            btn.click(() => {
              const form = modal.find('form')[0];
              const input = modal.find(`#${json.filename}-input`)[0];
              if (input.files.length) {
                upload(form);
              }
            });
          }
      }
      return btn;
    });

    modal.find('.modal-footer').append(buttons);
  }
}

function generateModal(modalType, text, id) {
  const modal = $(`<div class="modal fade show" id="${id}" tabindex="-1" role="dialog">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <form id="${id}-form" enctype="${modalType === 'upload' ? 'multipart/form-data' : ''}">
        <div class="modal-body">
          <p class="modal-body-text">${text}</p>
        </div>
        <div class="modal-footer"></div>
      </form>
    </div>
  </div>
</div>`)
  if (modalType === 'input') {
    modal.find('.modal-body').append($(`<p class="modal-body-input"><input id="${id}-input" type="text" /></p>`))
  } else if (modalType === 'upload') {
    modal.find('.modal-body').append($(`<p class="modal-body-input"><input id="${id}-input" type="file" name="file" /></p>`))
  }
  return modal
}

/* Backend communication */

function launch(module) {
  sendMessage('/launch', { launch: module }, true, handleResponse);
}

function display() {
  // Get the selected item
  const value = document.getElementById('Display_menu').value;
  if (value) {
    sendMessage('/display', { display: value }, false);
  }
}

function query() {
  // Get the selected item
  const value = document.getElementById('Query_menu').value;
  if (value) {
    sendMessage('/query', { query: value }, false);
  }
}

function exit() {
  sendMessage('/exit');
}

function reply(message) {
  sendMessage('/request', { msg: message }, true, handleResponse);
}

function sendMessage(target, message, isJson, callback) {
  $.ajax({
    type: 'POST',
    url: target,
    data: isJson ? JSON.stringify(message) : message,
    dataType: 'json',
    contentType: isJson ? 'application/json; encoding=utf-8' : false
  }).done((data) => {
    if (callback) {
      callback(data);
    }
  }).fail(() => {
    const text = 'The server is not responding. Please check if it is running.';
    const alert = $(`<div class="alert alert-danger" role="alert">${text}&nbsp;&nbsp;<button class="close" data-dismiss="alert">×</button></div>`);
    $('#alert-anchor').append(alert);
  });
}

function upload(form) {
  $.ajax({
    type: 'POST',
    url: '/file_request',
    data: new FormData(form),
    dataType: 'json',
    cache: false,
    contentType: false,
    processData: false
  }).done((data) => {
    handleResponse(data);
  }).fail(() => {
    const text = 'The server is not responding. Please check if it is running.';
    const alert = $(`<div class="alert alert-danger" role="alert">${text}&nbsp;&nbsp;<button class="close" data-dismiss="alert">×</button></div>`);
    $('#alert-anchor').append(alert);
  });
}
