var Habitation = db.define('habitations', {
    id:      {type: 'serial', key: true}, // the auto-incrementing primary key
    name:    {type: 'text'},
    surname: {type: 'text'},
    age:     {type: 'number'}
  }, {
    methods : {
      fullName: function() {
        return this.name + ' ' + this.surname;
      }
    }
  });