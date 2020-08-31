import React, { useRef, useCallback } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import * as Yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import { Form } from '@unform/mobile';
import { FormHandles } from '@unform/core';
import Icon from 'react-native-vector-icons/Feather';
import ImagePicker from 'react-native-image-picker';
import { useAuth } from '../../hooks/auth';
import Button from '../../components/Button';
import Input from '../../components/Input';
import getValidatoinErrors from '../../utils/getValidationErros';

import {
  Container,
  Title,
  BackButton,
  UserAvatarButton,
  UserAvatar,
} from './styles';
import api from '../../services/api';

interface ProfileFormData {
  name: string;
  email: string;
  password: string;
  old_password: string;
  password_confirmation: string;
}
const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();

  const formRef = useRef<FormHandles>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const oldPasswordInputRef = useRef<TextInput>(null);
  const confirmedPasswordInputRef = useRef<TextInput>(null);

  const navigation = useNavigation();

  const handleUpdateUserData = useCallback(
    async (data: ProfileFormData) => {
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string().required('Nome obrigatório'),
          email: Yup.string()
            .required('Email obrigatório')
            .email('Digite um email válido'),
          old_password: Yup.string(),
          password: Yup.string().when('old_password', {
            is: (val) => !!val.length,
            then: Yup.string().required('Campo obrigatório'),
            otherwise: Yup.string(),
          }),
          password_confirmation: Yup.string()
            .when('old_password', {
              is: (val) => !!val.length,
              then: Yup.string().required('Campo obrigatório'),
              otherwise: Yup.string(),
            })
            .oneOf([Yup.ref('password'), null], 'As senhas devem ser iguais.'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const {
          email,
          name,
          old_password,
          password,
          password_confirmation,
        } = data;

        // valida se a pessoa tbm quer atualizar a senha ou so o nome
        const formData = {
          name,
          email,
          ...(old_password
            ? { old_password, password, password_confirmation }
            : {}),
        };

        const response = await api.put('/profile', formData);

        updateUser(response.data);
        Alert.alert('Perfil atualizado com sucesso!');

        navigation.goBack();
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidatoinErrors(err);
          formRef.current?.setErrors(errors);

          return;
        }

        Alert.alert(
          'Erro na atualização dos dados de perfil.',
          'Ocorreu um erro ao atualizar os dados. Tente novamente!'
        );
      }
    },
    [navigation, updateUser]
  );

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleUpdateAvatar = useCallback(() => {
    ImagePicker.showImagePicker(
      {
        title: 'Selecione um Avatar',
        cancelButtonTitle: 'Cancelar',
        chooseFromLibraryButtonTitle: 'Escolher da galeria',
        takePhotoButtonTitle: 'Usar câmera',
      },
      (response) => {
        if (response.didCancel) {
          return;
        }

        if (response.error) {
          Alert.alert('Erro ao atualizar seu avatar', response.error);
          return;
        }

        const data = new FormData();

        data.append('avatar', {
          type: 'image/jpeg',
          name: `${user.id}.jpg`,
          uri: response.uri,
        });

        api
          .patch('users/avatar', data)
          .then((apiResponse) => {
            updateUser(apiResponse.data);
          })
          .catch((error) => console.log(error.toString()));
      }
    );
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <Container>
          <BackButton onPress={handleGoBack}>
            <Icon name="chevron-left" size={24} color="#999591" />
          </BackButton>
          <UserAvatarButton onPress={handleUpdateAvatar}>
            <UserAvatar
              source={{
                uri:
                  user.avatar_url ||
                  'https://media-exp1.licdn.com/dms/image/C4D03AQHih2j8IjrWtg/profile-displayphoto-shrink_200_200/0?e=1601510400&v=beta&t=-F3606F7cE0wsZ4vNtza2sG4tKk7P42BRsyLBTRf2FU',
              }}
            />
          </UserAvatarButton>

          <View>
            <Title>Meu perfil</Title>
          </View>
          <Form
            initialData={user}
            ref={formRef}
            onSubmit={handleUpdateUserData}
          >
            <Input
              autoCapitalize="words"
              name="name"
              icon="user"
              placeholder="Nome"
              returnKeyType="next"
              onSubmitEditing={() => {
                emailInputRef.current?.focus();
              }}
            />
            <Input
              ref={emailInputRef}
              keyboardType="email-address"
              autoCorrect={false}
              autoCapitalize="none"
              name="email"
              icon="mail"
              placeholder="E-mail"
              returnKeyType="next"
              onSubmitEditing={() => {
                passwordInputRef.current?.focus();
              }}
            />
            <Input
              ref={passwordInputRef}
              secureTextEntry
              name="pasold_password"
              icon="lock"
              placeholder="Senha atual"
              containerStyle={{ marginTop: 16 }}
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => oldPasswordInputRef.current?.focus()}
            />

            <Input
              ref={oldPasswordInputRef}
              secureTextEntry
              name="password"
              icon="lock"
              placeholder="Nova senha"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmedPasswordInputRef.current?.focus()}
            />

            <Input
              ref={confirmedPasswordInputRef}
              secureTextEntry
              name="password_confirmation"
              icon="lock"
              placeholder="Confirmar senha"
              textContentType="newPassword"
              returnKeyType="send"
              onSubmitEditing={() => formRef.current?.submitForm()}
            />
            <Button onPress={() => formRef.current?.submitForm()}>
              Confirmar mudança
            </Button>
          </Form>
        </Container>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Profile;
