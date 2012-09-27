
function defineModels(mongoose, fn) {
  var Schema = mongoose.Schema,
      ObjectId = Schema.ObjectId;

  /**
    * Model: User
    */
  function validatePresenceOf(value) {
    var re  = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i

    return value && value.length && re.test(value);
  }

  User = new Schema({
    'email': { type: String, validate: [validatePresenceOf, 'A valid email is required'], index: { unique: true } }
  });

  User.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });

  mongoose.model('User', User);

  fn();
}

exports.defineModels = defineModels; 

