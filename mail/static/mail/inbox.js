document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  //for sending the mail
  document.querySelector('#compose-form').addEventListener('submit', send_email);
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#mail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(mail => {

      if ((mailbox === 'inbox' && mail.archived === false) || (mailbox === 'archive' && mail.archived === true) || (mailbox === 'sent')) {
        const element = document.createElement('div');
        element.className = 'list-group-item';
        if (mail.read === true ){
          element.style.background = 'rgb(170, 168, 168)';
        }
        else{
          element.style.background = 'white';
        }
        element.innerHTML = `
        <h6>From: ${mail.sender}</h6>
        <h6>To: ${mail.recipients}</h6>
        <h6>Subject: ${mail.subject}</h6>
        <h6>Timestamp: ${mail.timestamp}</h6>`;
        
        element.addEventListener('click', () => mail_view(mail.id));

        document.querySelector('#emails-view').append(element);
      }
  });
  }); 
}

function mail_view(mail_id) {
  fetch(`/emails/${mail_id}`)
  .then(response => response.json())
  .then(email => {
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#mail-view').style.display = 'block';

      document.querySelector('#mail-view').innerHTML = `
      <ul class="list-group">
        <li class="list-group-item active"><strong>From:</strong> ${email.sender} </li>
        <li class="list-group-item"><strong>To:</strong> ${email.recipients} </li>
        <li class="list-group-item"><strong>subject:</strong> ${email.subject} </li>
        <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp} </li>
        <li class="list-group-item"> ${email.body} </li>
      </ul>
      `

    //make it read
    if (!email.read){
      fetch(`/emails/${mail_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }

    // Archive
    const archivebtn = document.createElement('button');
    archivebtn.className = 'btn btn-primary';
    if ( email.archived === false ){
      archivebtn.innerHTML =  'Archive';
    }
    else{
      archivebtn.innerHTML =  'Unarchive';
    }

    archivebtn.addEventListener('click', function() {
      fetch(`/emails/${mail_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !email.archived
        })
      })
      .then( () => {
        load_mailbox('archive');
      })
});    
      document.querySelector('#mail-view').append(archivebtn);


    //reply 
    const replybtn = document.createElement('button');
    replybtn.className = 'btn btn-primary replybutton';
    replybtn.innerHTML =  'Reply';
    replybtn.addEventListener('click', function() {
    compose_email();

    document.querySelector('#compose-recipients').value = email.sender;
    let subject = email.subject;
    if ( subject.split(' ',1)[0] != 'Re:'){
      subject = "Re: " + email.subject;
    }
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body} `;
    })

    document.querySelector('#mail-view').append(replybtn);

});
}

function send_email(event) {
  event.preventDefault();
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body : JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body 
    })
  })
  .then(response => response.json())
  .then(result => {
    load_mailbox('sent');
  });
}
